import type { FastifyInstance } from 'fastify'
import { getPerformanceSummary, getDailyPerformance } from '../services/performance.service'

export async function performanceRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/summary', auth, async (req) => {
    const { days = 30 } = req.query as { days?: number }
    return getPerformanceSummary(req.user.tenantId, Number(days))
  })

  app.get('/daily', auth, async (req) => {
    const { days = 30 } = req.query as { days?: number }
    return getDailyPerformance(req.user.tenantId, Number(days))
  })
}
