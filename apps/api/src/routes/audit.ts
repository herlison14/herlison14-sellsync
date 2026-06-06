import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { listAuditLogs } from '../services/audit.service'

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => { await req.jwtVerify() })

  app.get('/', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const { entity, userId, page, limit } = z.object({
      entity: z.string().optional(),
      userId: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().max(100).default(50),
    }).parse(req.query)

    return listAuditLogs(tenantId, { entity, userId, page, limit })
  })
}
