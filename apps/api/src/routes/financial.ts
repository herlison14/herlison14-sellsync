import type { FastifyInstance } from 'fastify'
import {
  syncFinancialFromOrders,
  getFinancialSummary,
  getTransactions,
  getDailyCashflow,
} from '../services/financial.service'

export async function financialRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.post('/sync', auth, async (req, reply) => {
    const { days = 30 } = req.body as { days?: number }
    const result = await syncFinancialFromOrders(req.user.tenantId, days)
    return result
  })

  app.get('/summary', auth, async (req) => {
    const { days = 30 } = req.query as { days?: number }
    return getFinancialSummary(req.user.tenantId, Number(days))
  })

  app.get('/transactions', auth, async (req) => {
    const { days, type, marketplace, page, limit } = req.query as Record<string, string>
    return getTransactions(req.user.tenantId, {
      days: days ? Number(days) : 30,
      type: type as any,
      marketplace: marketplace as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    })
  })

  app.get('/cashflow', auth, async (req) => {
    const { days = 30 } = req.query as { days?: number }
    return getDailyCashflow(req.user.tenantId, Number(days))
  })
}
