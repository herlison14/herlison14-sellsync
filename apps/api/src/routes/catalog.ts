import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  detectCatalogDrift, syncListing, bulkSyncListings,
  getCatalogStats, getListingsWithProducts,
} from '../services/catalog.service'

export async function catalogRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/stats', auth, async (req) => getCatalogStats(req.user.tenantId))

  app.get('/drift', auth, async (req) => {
    const drifts = await detectCatalogDrift(req.user.tenantId)
    return { drifts, total: drifts.length }
  })

  app.get('/listings', auth, async (req) => {
    const { page, limit, search } = req.query as Record<string, string>
    return getListingsWithProducts(req.user.tenantId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 30,
      search,
    })
  })

  app.post('/sync/:listingId', auth, async (req, reply) => {
    const { listingId } = req.params as { listingId: string }
    try {
      return await syncListing(req.user.tenantId, listingId)
    } catch (err: any) {
      return reply.status(404).send({ error: err.message })
    }
  })

  app.post('/sync-bulk', auth, async (req) => {
    const { listingIds } = z.object({
      listingIds: z.array(z.string().uuid()).min(1).max(100),
    }).parse(req.body)
    return bulkSyncListings(req.user.tenantId, listingIds)
  })
}
