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

  // loja-descartaveis (canal próprio, primeira parte) — integração de
  // confiança, sem HMAC sobre o corpo como o Shopee: um bearer token fixo
  // já basta, comparado em tempo constante pra evitar timing attack.
  app.post('/lojadescartaveis', async (req, reply) => {
    const auth = req.headers['authorization'] as string | undefined
    const token = auth?.replace(/^Bearer\s+/i, '') ?? ''
    const expected = process.env.LOJADESCARTAVEIS_WEBHOOK_SECRET ?? ''

    const tokenBuf = Buffer.from(token)
    const expectedBuf = Buffer.from(expected)
    const valid =
      tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)
    if (!expected || !valid) return reply.code(401).send()

    await webhookQueue.add('lojadescartaveis-notification', req.body, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    })
    return reply.code(200).send()
  })
}
