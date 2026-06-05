import type { Job } from 'bullmq'
import { prisma } from '@sellsync/database'
import { MarketplaceAdapterFactory } from '@sellsync/integrations'
import { inventorySyncQueue, nfeQueue } from './queues'

export async function processOrder(job: Job) {
  const { name, data } = job

  if (name === 'import-ml-order' || name === 'import-shopee-order') {
    const { storeId, externalId } = data as { storeId: string; externalId: string }

    const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } })
    const adapter = await MarketplaceAdapterFactory.create(store)
    const rawOrder = await adapter.getOrder(externalId)

    const order = await prisma.order.upsert({
      where: { storeId_externalId: { storeId, externalId } },
      create: {
        tenantId: store.tenantId,
        storeId,
        externalId,
        marketplace: store.marketplace,
        status: mapStatus(rawOrder.status, store.marketplace),
        buyerName: rawOrder.buyerName,
        buyerEmail: rawOrder.buyerEmail,
        shippingAddr: rawOrder.shippingAddress,
        subtotal: rawOrder.subtotal,
        shippingCost: rawOrder.shippingCost,
        total: rawOrder.total,
        paidAt: rawOrder.paidAt,
        externalData: rawOrder.rawData,
        items: {
          create: rawOrder.items.map((item) => ({
            externalId: item.externalId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      update: {
        status: mapStatus(rawOrder.status, store.marketplace),
        externalData: rawOrder.rawData,
      },
    })

    // Reserve stock for new orders
    if (order.status === 'CONFIRMED') {
      for (const item of rawOrder.items) {
        const product = await prisma.product.findFirst({
          where: { tenantId: store.tenantId, sku: item.sku },
        })
        if (product) {
          await prisma.stockItem.updateMany({
            where: { productId: product.id },
            data: { reserved: { increment: item.quantity } },
          })
          await inventorySyncQueue.add('sync-product', { productId: product.id, tenantId: store.tenantId })
        }
      }
    }

    // Auto-emit NF-e on confirmed + paid orders
    if (order.status === 'CONFIRMED' && order.paidAt) {
      await nfeQueue.add('emit-nfe', { orderId: order.id, tenantId: store.tenantId })
    }
  }
}

function mapStatus(externalStatus: string, marketplace: string): string {
  const mlMap: Record<string, string> = {
    confirmed: 'CONFIRMED',
    payment_in_process: 'PENDING',
    payment_required: 'PENDING',
    paid: 'CONFIRMED',
    cancelled: 'CANCELLED',
  }
  const shopeeMap: Record<string, string> = {
    UNPAID: 'PENDING',
    READY_TO_SHIP: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    COMPLETED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  }

  if (marketplace === 'MERCADO_LIVRE') return mlMap[externalStatus] ?? 'PENDING'
  if (marketplace === 'SHOPEE') return shopeeMap[externalStatus] ?? 'PENDING'
  return 'PENDING'
}
