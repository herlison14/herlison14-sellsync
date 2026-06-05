import type { Job } from 'bullmq'
import { prisma } from '@sellsync/database'
import { MarketplaceAdapterFactory } from '@sellsync/integrations'

export async function processInventorySync(job: Job<{ productId: string; tenantId: string }>) {
  const { productId, tenantId } = job.data

  const stock = await prisma.stockItem.findMany({
    where: { productId },
    select: { quantity: true, reserved: true },
  })

  const available = stock.reduce((sum, s) => sum + s.quantity - s.reserved, 0)

  const listings = await prisma.listing.findMany({
    where: {
      productId,
      status: 'ACTIVE',
      store: { tenantId },
    },
    include: { store: true },
  })

  await Promise.allSettled(
    listings.map(async (listing) => {
      const adapter = await MarketplaceAdapterFactory.create(listing.store)
      await adapter.updateStock(listing.externalId, available)
    })
  )
}
