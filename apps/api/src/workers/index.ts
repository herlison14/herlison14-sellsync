import { Worker } from 'bullmq'
import { redis } from './queues'
import { processWebhook } from './webhook.worker'
import { processInventorySync } from './inventory.worker'
import { processOrder } from './order.worker'
import { processNfe } from './nfe.worker'

export async function startWorkers() {
  new Worker('webhooks', processWebhook, { connection: redis, concurrency: 10 })
  new Worker('inventory-sync', processInventorySync, { connection: redis, concurrency: 20 })
  new Worker('orders', processOrder, { connection: redis, concurrency: 5 })
  new Worker('nfe', processNfe, { connection: redis, concurrency: 3 })
}
