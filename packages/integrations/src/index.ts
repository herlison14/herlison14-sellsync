import type { Store } from '@sellsync/database'
import { MercadoLivreAdapter } from './mercadolivre/adapter'
import { ShopeeAdapter } from './shopee/adapter'
import { AmazonAdapter } from './amazon/adapter'
import { MagaluAdapter } from './magalu/adapter'
import { AmericanasAdapter } from './americanas/adapter'
import { SheinAdapter } from './shein/adapter'
import { TikTokShopAdapter } from './tiktokshop/adapter'
import type { IMarketplaceAdapter } from './base/adapter'

export { MercadoLivreAdapter } from './mercadolivre/adapter'
export { ShopeeAdapter } from './shopee/adapter'
export { AmazonAdapter } from './amazon/adapter'
export { MagaluAdapter } from './magalu/adapter'
export { AmericanasAdapter } from './americanas/adapter'
export { SheinAdapter } from './shein/adapter'
export { TikTokShopAdapter } from './tiktokshop/adapter'
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

      case 'MAGALU':
        return new MagaluAdapter(
          process.env.MAGALU_CLIENT_ID!,
          process.env.MAGALU_CLIENT_SECRET!,
          store.externalId,
        )

      case 'AMERICANAS':
        return new AmericanasAdapter(
          process.env.AMERICANAS_EMAIL!,
          store.accessToken,
          process.env.AMERICANAS_ACCOUNT_MANAGER!,
        )

      case 'SHEIN':
        return new SheinAdapter(
          process.env.SHEIN_APP_KEY!,
          process.env.SHEIN_APP_SECRET!,
          store.accessToken,
        )

      case 'TIKTOK_SHOP':
        return new TikTokShopAdapter(
          process.env.TIKTOK_APP_KEY!,
          process.env.TIKTOK_APP_SECRET!,
          store.accessToken,
          store.externalId,
        )

      default:
        throw new Error(`Adapter not implemented for: ${store.marketplace}`)
    }
  }
}
