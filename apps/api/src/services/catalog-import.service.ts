import axios from 'axios'
import { prisma } from '@sellsync/database'

// Formato devolvido por GET /api/sellsync/variants na loja — uma linha por
// variação ativa, já com produto pai, tier de preço base e estoque.
interface LojaVariant {
  sku: string
  productName: string
  variantLabel: string
  price: number
  quantityOnHand: number
  description: string | null
}

export class CatalogImportService {
  // Importação única, disparada manualmente pelo painel depois de conectar
  // a loja (não é job recorrente — a partir daqui, tudo é orientado a
  // evento via webhook/push, não polling).
  async importFromLojaDescartaveis(tenantId: string, storeId: string) {
    const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId, tenantId } })

    const { data: variants } = await axios.get<LojaVariant[]>(
      `${process.env.LOJADESCARTAVEIS_API_URL}/api/sellsync/variants`,
      { headers: { Authorization: `Bearer ${store.accessToken}` } },
    )

    const warehouse = await prisma.warehouse.upsert({
      where: { tenantId_name: { tenantId, name: 'HC Magazine' } },
      create: { tenantId, name: 'HC Magazine', isDefault: false },
      update: {},
    })

    let imported = 0
    for (const v of variants) {
      const product = await prisma.product.upsert({
        where: { tenantId_sku: { tenantId, sku: v.sku } },
        create: {
          tenantId,
          sku: v.sku,
          name: `${v.productName} — ${v.variantLabel}`,
          description: v.description ?? undefined,
        },
        update: {
          name: `${v.productName} — ${v.variantLabel}`,
          description: v.description ?? undefined,
        },
      })

      await prisma.stockItem.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
        create: { productId: product.id, warehouseId: warehouse.id, quantity: v.quantityOnHand },
        update: { quantity: v.quantityOnHand },
      })

      await prisma.listing.upsert({
        where: { storeId_externalId: { storeId, externalId: v.sku } },
        create: {
          storeId,
          productId: product.id,
          externalId: v.sku,
          title: `${v.productName} — ${v.variantLabel}`,
          price: v.price,
          status: 'ACTIVE',
          syncedAt: new Date(),
        },
        update: {
          title: `${v.productName} — ${v.variantLabel}`,
          price: v.price,
          syncedAt: new Date(),
        },
      })

      imported++
    }

    return { imported, total: variants.length }
  }
}
