import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { InventoryService } from '../services/inventory.service'

const adjustSchema = z.object({
  warehouseId: z.string(),
  quantity: z.number().int(),
  reason: z.string().optional(),
})

export async function inventoryRoutes(app: FastifyInstance) {
  const service = new InventoryService()

  app.addHook('onRequest', async (req) => {
    await req.jwtVerify()
  })

  app.get('/', async (req) => {
    const tenantId = (req.user as { tenantId: string }).tenantId
    const query = z.object({
      warehouseId: z.string().optional(),
      lowStock: z.coerce.boolean().optional(),
      search: z.string().optional(),
    }).parse(req.query)
    return service.list({ tenantId, ...query })
  })

  app.get('/:productId', async (req) => {
    const { productId } = req.params as { productId: string }
    const tenantId = (req.user as { tenantId: string }).tenantId
    return service.getByProduct({ tenantId, productId })
  })

  app.post('/:productId/adjust', async (req) => {
    const { productId } = req.params as { productId: string }
    const tenantId = (req.user as { tenantId: string }).tenantId
    const body = adjustSchema.parse(req.body)
    return service.adjust({ tenantId, productId, ...body })
  })

  app.post('/sync', async (req, reply) => {
    const tenantId = (req.user as { tenantId: string }).tenantId
    await service.syncAllMarketplaces(tenantId)
    return reply.code(202).send({ message: 'Sync enqueued' })
  })

  app.get('/alerts/low-stock', async (req) => {
    const tenantId = (req.user as { tenantId: string }).tenantId
    return service.getLowStockAlerts(tenantId)
  })
}
