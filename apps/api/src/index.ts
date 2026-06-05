import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { ordersRoutes } from './routes/orders'
import { inventoryRoutes } from './routes/inventory'
import { productsRoutes } from './routes/products'
import { integrationsRoutes } from './routes/integrations'
import { webhooksRoutes } from './routes/webhooks'
import { authRoutes } from './routes/auth'
import { nfeRoutes } from './routes/nfe'
import { pricingRoutes } from './routes/pricing'
import { reportsRoutes } from './routes/reports'
import { startWorkers } from './workers'

const app = Fastify({ logger: true })

async function bootstrap() {
  await app.register(cors, { origin: process.env.WEB_URL ?? '*' })
  await app.register(jwt, { secret: process.env.JWT_SECRET! })
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })

  await app.register(authRoutes,         { prefix: '/auth' })
  await app.register(ordersRoutes,       { prefix: '/orders' })
  await app.register(inventoryRoutes,    { prefix: '/inventory' })
  await app.register(productsRoutes,     { prefix: '/products' })
  await app.register(integrationsRoutes, { prefix: '/integrations' })
  await app.register(webhooksRoutes,     { prefix: '/webhooks' })
  await app.register(nfeRoutes,          { prefix: '/nfe' })
  await app.register(pricingRoutes,      { prefix: '/pricing' })
  await app.register(reportsRoutes,      { prefix: '/reports' })

  await startWorkers()

  await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
}

bootstrap().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
