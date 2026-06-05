import type { FastifyInstance } from 'fastify'
import {
  getReturns,
  getReturn,
  createReturn,
  updateReturnStatus,
  getReturnsSummary,
} from '../services/returns.service'

export async function returnsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/', auth, async (req) => {
    const { status, marketplace, page, limit } = req.query as Record<string, string>
    return getReturns(req.user.tenantId, {
      status: status as any,
      marketplace: marketplace as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
    })
  })

  app.get('/summary', auth, async (req) => {
    return getReturnsSummary(req.user.tenantId)
  })

  app.get('/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    const ret = await getReturn(req.user.tenantId, id)
    if (!ret) return reply.status(404).send({ error: 'Not found' })
    return ret
  })

  app.post('/', auth, async (req, reply) => {
    try {
      const body = req.body as any
      const ret = await createReturn(req.user.tenantId, body)
      return reply.status(201).send(ret)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch('/:id/status', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const body = req.body as any
      return updateReturnStatus(req.user.tenantId, id, body)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
