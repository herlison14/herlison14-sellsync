import { prisma } from '@sellsync/database'
import { inventorySyncQueue } from '../workers/queues'

interface ListParams {
  tenantId: string
  warehouseId?: string
  lowStock?: boolean
  search?: string
}

interface AdjustParams {
  tenantId: string
  productId: string
  warehouseId: string
  quantity: number
  reason?: string
}

export class InventoryService {
  async list({ tenantId, warehouseId, lowStock, search }: ListParams) {
    const items = await prisma.stockItem.findMany({
      where: {
        product: {
          tenantId,
          ...(search && { name: { contains: search, mode: 'insensitive' } }),
        },
        ...(warehouseId && { warehouseId }),
        ...(lowStock && { quantity: { lte: prisma.stockItem.fields.minAlert } }),
      },
      include: {
        product: { select: { id: true, sku: true, name: true, images: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { quantity: 'asc' },
    })

    return items
  }

  async getByProduct({ tenantId, productId }: { tenantId: string; productId: string }) {
    const product = await prisma.product.findFirstOrThrow({
      where: { id: productId, tenantId },
    })

    const stock = await prisma.stockItem.findMany({
      where: { productId: product.id },
      include: { warehouse: true },
    })

    const movements = await prisma.stockMovement.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return { product, stock, movements }
  }

  async adjust({ tenantId, productId, warehouseId, quantity, reason }: AdjustParams) {
    const product = await prisma.product.findFirstOrThrow({
      where: { id: productId, tenantId },
    })

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        update: { quantity: { increment: quantity } },
        create: { productId: product.id, warehouseId, quantity: Math.max(0, quantity) },
      })

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId,
          type: quantity >= 0 ? 'IN' : 'OUT',
          quantity: Math.abs(quantity),
          reason,
        },
      })

      return item
    })

    await inventorySyncQueue.add('sync-product', { productId: product.id, tenantId }, {
      jobId: `sync-${product.id}`,
      delay: 500,
    })

    return result
  }

  async syncAllMarketplaces(tenantId: string) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: { id: true },
    })

    for (const product of products) {
      await inventorySyncQueue.add('sync-product', { productId: product.id, tenantId }, {
        jobId: `sync-${product.id}`,
        delay: 100,
      })
    }
  }

  async getLowStockAlerts(tenantId: string) {
    const items = await prisma.stockItem.findMany({
      where: {
        product: { tenantId },
        quantity: { lte: 5 },
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { name: true } },
      },
    })

    return items.map((item) => ({
      ...item,
      available: item.quantity - item.reserved,
      isOut: item.quantity === 0,
    }))
  }
}
