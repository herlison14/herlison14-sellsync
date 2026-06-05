import type { Store } from '@sellsync/database'
import { MercadoLivreAdapter } from './mercadolivre/adapter'
import { ShopeeAdapter } from './shopee/adapter'
import { AmazonAdapter } from './amazon/adapter'
import type { IMarketplaceAdapter } from './base/adapter'

export { MercadoLivreAdapter } from './mercadolivre/adapter'
export { ShopeeAdapter } from './shopee/adapter'
export { AmazonAdapter } from './amazon/adapter'
export type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from './base/adapter'

export class MarketplaceAdapterFactory {
  static async create(store: Store): Promise<IMarketplaceAdapter> {
    switch (store.marketplace) {
      case 'MERCADO_LIVRE':
        return new MercadoLivreAdapter(store.accessToken)

      case 'SHOPEE':
        return new ShopeeAdapter(
          process.env.SHOPEE_PARTNER_ID!,
          process.env.SHOPEE_PARTNER_KEY!,
          store.externalId,
          store.accessToken,
        )

      case 'AMAZON':
        return new AmazonAdapter(
          process.env.AMAZON_CLIENT_ID!,
          process.env.AMAZON_CLIENT_SECRET!,
          store.accessToken,
          process.env.AMAZON_MARKETPLACE_ID,
        )

      default:
        throw new Error(`Adapter not implemented for: ${store.marketplace}`)
    }
  }
}
