import type { FastifyInstance } from 'fastify'
import {
  getRepricingRules,
  createRepricingRule,
  updateRepricingRule,
  deleteRepricingRule,
  runRepricingForTenant,
  getPriceHistory,
  getRepricingStats,
} from '../services/repricing.service'

export async function repricingRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/rules', auth, async (req) => getRepricingRules(req.user.tenantId))

  app.post('/rules', auth, async (req, reply) => {
    const rule = await createRepricingRule(req.user.tenantId, req.body as any)
    return reply.status(201).send(rule)
  })

  app.patch('/rules/:id', auth, async (req, reply) => {
    try {
      return updateRepricingRule(req.user.tenantId, (req.params as any).id, req.body as any)
    } catch (err: any) {
      return reply.status(404).send({ error: err.message })
    }
  })

  app.delete('/rules/:id', auth, async (req) => {
    await deleteRepricingRule(req.user.tenantId, (req.params as any).id)
    return { ok: true }
  })

  app.post('/run', auth, async (req) => runRepricingForTenant(req.user.tenantId))

  app.get('/stats', auth, async (req) => getRepricingStats(req.user.tenantId))

  app.get('/history/:listingId', auth, async (req) => {
    const { listingId } = req.params as { listingId: string }
    const { days = 30 } = req.query as { days?: number }
    return getPriceHistory(req.user.tenantId, listingId, Number(days))
  })
}
