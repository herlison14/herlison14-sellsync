import axios from 'axios'
import { prisma } from '@sellsync/database'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default'
  badge?: number
}

export async function sendPushNotification(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return

  // Expo batch limit is 100
  const chunks: PushMessage[][] = []
  for (let i = 0; i < messages.length; i += 100) chunks.push(messages.slice(i, i + 100))

  for (const chunk of chunks) {
    try {
      await axios.post(EXPO_PUSH_URL, chunk, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      })
    } catch {
      // non-critical — log and continue
    }
  }
}

export async function notifyTenantNewOrder(tenantId: string, orderId: string, orderNumber: string): Promise<void> {
  const tokens = await getTokens(tenantId)
  await sendPushNotification(tokens.map((t) => ({
    to: t,
    title: '🛍️ Novo pedido recebido',
    body: `Pedido #${orderNumber} aguarda processamento`,
    data: { type: 'new_order', orderId },
    sound: 'default',
  })))
}

export async function notifyTenantLowStock(tenantId: string, products: Array<{ name: string; sku: string; stock: number }>): Promise<void> {
  if (products.length === 0) return
  const tokens = await getTokens(tenantId)
  const body = products.length === 1
    ? `${products[0].name} — apenas ${products[0].stock} un.`
    : `${products.length} produtos com estoque baixo`

  await sendPushNotification(tokens.map((t) => ({
    to: t,
    title: '⚠️ Estoque baixo',
    body,
    data: { type: 'low_stock' },
    sound: 'default',
  })))
}

async function getTokens(tenantId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ token: string }>>`
    SELECT token FROM "PushToken" WHERE "tenantId" = ${tenantId}
  `
  return rows.map((r) => r.token)
}
