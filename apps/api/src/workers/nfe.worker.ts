import type { Job } from 'bullmq'
import { NFeService } from '@sellsync/nfe'

const service = new NFeService()

export async function processNfe(job: Job<{ orderId: string; tenantId: string; action?: string; nfeId?: string; reason?: string }>) {
  const { orderId, tenantId, action = 'emit', nfeId, reason } = job.data

  if (action === 'emit') {
    await service.emitForOrder(orderId, tenantId)
    return
  }

  if (action === 'poll' && nfeId) {
    await service.pollStatus(orderId, nfeId)
    return
  }

  if (action === 'cancel' && reason) {
    await service.cancel(orderId, tenantId, reason)
    return
  }
}
