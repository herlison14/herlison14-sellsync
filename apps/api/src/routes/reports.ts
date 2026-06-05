import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { subDays, startOfDay, endOfDay, parseISO } from 'date-fns'
import { ReportsService } from '../services/reports.service'

const service = new ReportsService()

const periodSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
})

function parsePeriod(query: { from?: string; to?: string; days?: number }) {
  const to = query.to ? endOfDay(parseISO(query.to)) : endOfDay(new Date())
  const from = query.from ? startOfDay(parseISO(query.from)) : startOfDay(subDays(new Date(), (query.days ?? 30) - 1))
  return { from, to }
}

export async function reportsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => {
    await req.jwtVerify()
  })

  app.get('/overview', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const query = periodSchema.parse(req.query)
    const { from, to } = parsePeriod(query)
    return service.overview(tenantId, from, to)
  })

  app.get('/daily-sales', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const { days } = periodSchema.parse(req.query)
    return service.dailySales(tenantId, days)
  })

  app.get('/top-products', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const query = periodSchema.parse(req.query)
    const { from, to } = parsePeriod(query)
    const { limit } = z.object({ limit: z.coerce.number().max(50).default(10) }).parse(req.query)
    return service.topProducts(tenantId, from, to, limit)
  })

  app.get('/nfe-summary', async (req) => {
    const { tenantId } = req.user as { tenantId: string }
    const query = periodSchema.parse(req.query)
    const { from, to } = parsePeriod(query)
    return service.nfeSummary(tenantId, from, to)
  })
}
