import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Marketplace, RepricingStrategy } from '@sellsync/database'
import {
  getRepricingRules,
  createRepricingRule,
  updateRepricingRule,
  deleteRepricingRule,
  runRepricingForTenant,
  getPriceHistory,
  getRepricingStats,
} from '../services/repricing.service'
import { requireRole } from '../lib/rbac'

// Nomes de campo e valores de enum alinhados com repricing.service.ts —
// o schema antigo ('LOWEST'/'AVERAGE'/'FIXED_MARGIN'/'CUSTOM', campo
// 'margin') não correspondia a nada em RepricingStrategy nem na service,
// então toda criação/atualização de regra falhava na tipagem (e teria
// falhado em runtime também, silenciosamente perdendo os campos).
const ruleSchema = z.object({
  name:             z.string().min(1).max(100),
  listingId:        z.string().optional(),
  marketplace:      z.nativeEnum(Marketplace).optional(),
  strategy:         z.nativeEnum(RepricingStrategy),
  targetMargin:     z.number().min(0).max(100).optional(),
  minPrice:         z.number().positive().optional(),
  maxPrice:         z.number().positive().optional(),
  adjustmentPct:    z.number().optional(),
  isActive:         z.boolean().optional(),
})

export async function repricingRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/rules', auth, async (req) => getRepricingRules(req.user.tenantId))

  app.post('/rules', auth, async (req, reply) => {
    const body = ruleSchema.parse(req.body)
    const rule = await createRepricingRule(req.user.tenantId, body)
    return reply.status(201).send(rule)
  })

  app.patch('/rules/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = ruleSchema.partial().parse(req.body)
    try {
      return updateRepricingRule(req.user.tenantId, id, body)
    } catch (err: any) {
      return reply.status(404).send({ error: err.message })
    }
  })

  app.delete('/rules/:id', { preHandler: [app.authenticate, requireRole('OWNER', 'ADMIN')] }, async (req) => {
    const { id } = req.params as { id: string }
    await deleteRepricingRule(req.user.tenantId, id)
    return { ok: true }
  })

  app.post('/run', { preHandler: [app.authenticate, requireRole('OWNER', 'ADMIN')] }, async (req) => runRepricingForTenant(req.user.tenantId))

  app.get('/stats', auth, async (req) => getRepricingStats(req.user.tenantId))

  app.get('/history/:listingId', auth, async (req) => {
    const { listingId } = req.params as { listingId: string }
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(req.query)
    return getPriceHistory(req.user.tenantId, listingId, days)
  })
}
