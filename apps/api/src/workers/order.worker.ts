import type { Job } from 'bullmq'
import { prisma, OrderStatus, Prisma } from '@sellsync/database'
import { MarketplaceAdapterFactory, type MarketplaceOrder } from '@sellsync/integrations'
import { inventorySyncQueue, nfeQueue } from './queues'
import { notifyTenantNewOrder } from '../services/push.service'

const IMPORT_JOBS = ['import-ml-order', 'import-shopee-order', 'import-lojadescartaveis-order']

export async function processOrder(job: Job) {
  const { name, data } = job

  if (IMPORT_JOBS.includes(name)) {
    const store = await prisma.store.findUniqueOrThrow({ where: { id: (data as { storeId: string }).storeId } })

    // ML/Shopee só recebem um "avise que algo mudou" no webhook — o
    // adaptador tem que ir buscar o pedido de verdade na API deles. O
    // canal próprio já manda o pedido inteiro no payload do webhook (é
    // primeira parte, não precisa desse round-trip).
    let rawOrder: MarketplaceOrder
    let externalId: string
    if (name === 'import-lojadescartaveis-order') {
      rawOrder = (data as { orderPayload: MarketplaceOrder }).orderPayload
      externalId = rawOrder.externalId
    } else {
      externalId = (data as { externalId: string }).externalId
      const adapter = await MarketplaceAdapterFactory.create(store)
      rawOrder = await adapter.getOrder(externalId)
    }

    const { storeId } = data as { storeId: string }
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
        shippingAddr: rawOrder.shippingAddress as Prisma.InputJsonValue,
        subtotal: rawOrder.subtotal,
        shippingCost: rawOrder.shippingCost,
        total: rawOrder.total,
        paidAt: rawOrder.paidAt,
        externalData: rawOrder.rawData as Prisma.InputJsonValue,
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
        externalData: rawOrder.rawData as Prisma.InputJsonValue,
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

    // Push notification for new orders
    await notifyTenantNewOrder(store.tenantId, order.id, order.externalId)
  }
}

function mapStatus(externalStatus: string, marketplace: string): OrderStatus {
  const mlMap: Record<string, OrderStatus> = {
    confirmed: 'CONFIRMED',
    payment_in_process: 'PENDING',
    payment_required: 'PENDING',
    paid: 'CONFIRMED',
    cancelled: 'CANCELLED',
  }
  const shopeeMap: Record<string, OrderStatus> = {
    UNPAID: 'PENDING',
    READY_TO_SHIP: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    COMPLETED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  }
  const lojaMap: Record<string, OrderStatus> = {
    pending_payment: 'PENDING',
    paid: 'CONFIRMED',
    processing: 'CONFIRMED',
    shipped: 'SHIPPED',
    delivered: 'DELIVERED',
    canceled: 'CANCELLED',
    payment_expired: 'CANCELLED',
  }

  if (marketplace === 'MERCADO_LIVRE') return mlMap[externalStatus] ?? 'PENDING'
  if (marketplace === 'SHOPEE') return shopeeMap[externalStatus] ?? 'PENDING'
  if (marketplace === 'LOJA_DESCARTAVEIS') return lojaMap[externalStatus] ?? 'PENDING'
  return 'PENDING'
}
