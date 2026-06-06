import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DriftItem {
  listingId: string; productId: string; storeId: string
  marketplace: string; storeName: string; externalId: string
  listingTitle: string; productName: string; driftFields: string[]
  syncedAt: Date | null
}

export async function detectCatalogDrift(tenantId: string): Promise<DriftItem[]> {
  const listings = await prisma.listing.findMany({
    where: { product: { tenantId }, status: 'ACTIVE' },
    include: {
      product: { select: { name: true, tenantId: true } },
      store: { select: { name: true, marketplace: true } },
    },
  })

  const staleThreshold = 7 * 86_400_000
  const drifts: DriftItem[] = []

  for (const l of listings) {
    if (l.product.tenantId !== tenantId) continue
    const drift: string[] = []

    if (l.title !== l.product.name) drift.push('title')
    if (!l.syncedAt || Date.now() - l.syncedAt.getTime() > staleThreshold) drift.push('sync_stale')

    if (drift.length > 0) {
      drifts.push({
        listingId: l.id, productId: l.productId, storeId: l.storeId,
        marketplace: l.store.marketplace, storeName: l.store.name,
        externalId: l.externalId, listingTitle: l.title,
        productName: l.product.name, driftFields: drift, syncedAt: l.syncedAt,
      })
    }
  }
  return drifts
}

export async function syncListing(tenantId: string, listingId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, product: { tenantId } },
    include: { product: true },
  })
  if (!listing) throw new Error('Listing not found')
  await prisma.listing.update({
    where: { id: listingId },
    data: { title: listing.product.name, syncedAt: new Date() },
  })
  return { synced: 1, listingId }
}

export async function bulkSyncListings(tenantId: string, listingIds: string[]) {
  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds }, product: { tenantId } },
    include: { product: true },
  })
  for (const l of listings) {
    await prisma.listing.update({
      where: { id: l.id },
      data: { title: l.product.name, syncedAt: new Date() },
    })
  }
  return { synced: listings.length, total: listingIds.length }
}

export async function getCatalogStats(tenantId: string) {
  const [totalListings, activeListings, recentlySynced] = await Promise.all([
    prisma.listing.count({ where: { product: { tenantId } } }),
    prisma.listing.count({ where: { product: { tenantId }, status: 'ACTIVE' } }),
    prisma.listing.count({
      where: { product: { tenantId }, syncedAt: { gte: new Date(Date.now() - 24 * 3_600_000) } },
    }),
  ])
  return { totalListings, activeListings, recentlySynced }
}

export async function getListingsWithProducts(tenantId: string, params: {
  page?: number; limit?: number; search?: string
}) {
  const { page = 1, limit = 30, search } = params
  const where = {
    product: {
      tenantId,
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    },
  }
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, images: true } },
        store: { select: { name: true, marketplace: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ])
  return { listings, total, page, pages: Math.ceil(total / limit) }
}
