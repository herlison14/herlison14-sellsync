import { PrismaClient, ReturnStatus, ReturnReason, Marketplace } from '@prisma/client'

const prisma = new PrismaClient()

export async function getReturns(tenantId: string, params: {
  status?: ReturnStatus; marketplace?: Marketplace; page?: number; limit?: number
}) {
  const { status, marketplace, page = 1, limit = 25 } = params

  const where = {
    tenantId,
    ...(status && { status }),
    ...(marketplace && { marketplace }),
  }

  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      include: {
        order: { select: { externalId: true, buyerName: true } },
        store: { select: { name: true, marketplace: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.return.count({ where }),
  ])

  return { returns, total, page, pages: Math.ceil(total / limit) }
}

export async function getReturn(tenantId: string, id: string) {
  return prisma.return.findFirst({
    where: { id, tenantId },
    include: {
      order: { select: { externalId: true, buyerName: true, buyerEmail: true, total: true } },
      store: { select: { name: true, marketplace: true } },
      items: true,
    },
  })
}

export async function createReturn(tenantId: string, data: {
  orderId: string; reason: ReturnReason; buyerNote?: string
  items: Array<{ sku: string; name: string; quantity: number; unitPrice: number }>
}) {
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, tenantId },
    select: { storeId: true, marketplace: true, total: true },
  })
  if (!order) throw new Error('Order not found')

  const refundAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  return prisma.return.create({
    data: {
      tenantId,
      orderId: data.orderId,
      storeId: order.storeId,
      marketplace: order.marketplace,
      reason: data.reason,
      status: ReturnStatus.REQUESTED,
      buyerNote: data.buyerNote,
      refundAmount,
      items: {
        create: data.items.map((i) => ({ sku: i.sku, name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
      },
    },
    include: { items: true },
  })
}

export async function updateReturnStatus(tenantId: string, id: string, data: {
  status: ReturnStatus; sellerNote?: string; trackingCode?: string
}) {
  const ret = await prisma.return.findFirst({ where: { id, tenantId } })
  if (!ret) throw new Error('Return not found')

  const resolvedAt = ['REFUNDED', 'REJECTED', 'CLOSED'].includes(data.status) ? new Date() : undefined

  return prisma.return.update({
    where: { id },
    data: {
      status: data.status,
      sellerNote: data.sellerNote,
      trackingCode: data.trackingCode,
      resolvedAt,
    },
  })
}

export async function getReturnsSummary(tenantId: string) {
  const counts = await prisma.return.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: { id: true },
  })

  const byStatus: Record<string, number> = {}
  for (const c of counts) byStatus[c.status] = c._count.id

  const pending = (byStatus.REQUESTED ?? 0) + (byStatus.APPROVED ?? 0) + (byStatus.IN_TRANSIT ?? 0)
    + (byStatus.RECEIVED ?? 0) + (byStatus.INSPECTING ?? 0)

  const refundTotal = await prisma.return.aggregate({
    where: { tenantId, status: ReturnStatus.REFUNDED },
    _sum: { refundAmount: true },
  })

  return {
    pending,
    refunded: byStatus.REFUNDED ?? 0,
    rejected: byStatus.REJECTED ?? 0,
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    refundTotal: Number(refundTotal._sum.refundAmount ?? 0),
  }
}
