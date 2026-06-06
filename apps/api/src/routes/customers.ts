import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@sellsync/database'

export async function customersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => { await req.jwtVerify() })

  // GET /customers — aggregated buyer stats from orders
  app.get('/', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const { search, page = '1', limit = '30' } = req.query as Record<string, string>

    // Aggregate orders by buyerName + buyerDocument
    const buyers = await prisma.order.groupBy({
      by: ['buyerName', 'buyerDocument'],
      where: {
        tenantId,
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        ...(search && { buyerName: { contains: search, mode: 'insensitive' } }),
      },
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
      orderBy: { _sum: { total: 'desc' } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    const totalCount = await prisma.order.groupBy({
      by: ['buyerName', 'buyerDocument'],
      where: {
        tenantId,
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        ...(search && { buyerName: { contains: search, mode: 'insensitive' } }),
      },
      _count: { id: true },
    })

    return {
      customers: buyers.map((b) => ({
        name: b.buyerName,
        document: b.buyerDocument,
        orderCount: b._count.id,
        totalSpent: Number(b._sum.total ?? 0),
        lastOrderAt: b._max.createdAt,
      })),
      total: totalCount.length,
      page: Number(page),
      pages: Math.ceil(totalCount.length / Number(limit)),
    }
  })

  // GET /customers/:document — order history for a buyer
  app.get('/:document', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const { document } = req.params as { document: string }
    const { page = '1' } = req.query as Record<string, string>

    const orders = await prisma.order.findMany({
      where: { tenantId, buyerDocument: document },
      include: {
        store: { select: { name: true, marketplace: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * 20,
      take: 20,
    })

    const stats = await prisma.order.aggregate({
      where: { tenantId, buyerDocument: document, status: { notIn: ['CANCELLED', 'RETURNED'] } },
      _count: { id: true },
      _sum: { total: true },
    })

    return {
      orders,
      stats: {
        orderCount: stats._count.id,
        totalSpent: Number(stats._sum.total ?? 0),
      },
    }
  })
}
