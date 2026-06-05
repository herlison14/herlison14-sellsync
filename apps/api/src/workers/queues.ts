import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const webhookQueue = new Queue('webhooks', { connection: redis })
export const inventorySyncQueue = new Queue('inventory-sync', { connection: redis })
export const orderQueue = new Queue('orders', { connection: redis })
export const nfeQueue = new Queue('nfe', { connection: redis })
