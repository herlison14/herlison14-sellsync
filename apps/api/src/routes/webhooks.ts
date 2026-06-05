import type { FastifyInstance } from 'fastify'
import { webhookQueue } from '../workers/queues'
import crypto from 'node:crypto'

export async function webhooksRoutes(app: FastifyInstance) {
  // Mercado Livre envia notificações via POST para este endpoint
  app.post('/mercadolivre', async (req, reply) => {
    const payload = req.body as { resource: string; user_id: number; topic: string }
    await webhookQueue.add('ml-notification', payload, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
    return reply.code(200).send()
  })

  // Shopee usa assinatura HMAC-SHA256
  app.post('/shopee', async (req, reply) => {
    const signature = req.headers['authorization'] as string
    const timestamp = req.headers['timestamp'] as string
    const partnerId = process.env.SHOPEE_PARTNER_ID!
    const partnerKey = process.env.SHOPEE_PARTNER_KEY!

    const rawUrl = `${process.env.API_URL}/webhooks/shopee`
    const baseStr = `${partnerId}${rawUrl}${timestamp}`
    const expected = crypto.createHmac('sha256', partnerKey).update(baseStr).digest('hex')

    if (signature !== expected) return reply.code(401).send()

    await webhookQueue.add('shopee-notification', req.body, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
    return reply.code(200).send()
  })

  // Amazon SNS/SQS (push notifications via SP-API)
  app.post('/amazon', async (req, reply) => {
    await webhookQueue.add('amazon-notification', req.body, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
    return reply.code(200).send()
  })
}
