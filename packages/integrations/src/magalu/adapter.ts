import axios, { type AxiosInstance } from 'axios'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

// Magazine Luiza usa a plataforma Magalu Marketplace API (antiga B2W / Via Varejo)
const MAGALU_API = 'https://api.magalu.com/v1'

export class MagaluAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance

  constructor(
    private clientId: string,
    private clientSecret: string,
    private sellerId: string,
  ) {
    this.http = axios.create({ baseURL: MAGALU_API })
    this.http.interceptors.request.use(async (config) => {
      config.headers['Authorization'] = `Bearer ${await this.getToken()}`
      config.headers['x-seller-id'] = this.sellerId
      return config
    })
  }

  private tokenCache: { token: string; expiry: number } | null = null

  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiry) return this.tokenCache.token

    const { data } = await axios.post('https://id.magalu.com/oauth/token', new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

    this.tokenCache = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 }
    return data.access_token
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const { data } = await this.http.get(`/orders/${externalId}`)

    return {
      externalId: data.id,
      status: data.status,
      buyerName: data.customer?.name ?? '',
      buyerEmail: data.customer?.email,
      items: (data.order_items ?? []).map((item: Record<string, unknown>) => {
        const i = item as { product: { id: string; sku: string; title: string }; quantity: number; price: number }
        return {
          externalId: i.product.id,
          sku: i.product.sku,
          name: i.product.title,
          quantity: i.quantity,
          unitPrice: i.price,
        }
      }),
      subtotal: data.total_amount ?? 0,
      shippingCost: data.shipping_cost ?? 0,
      total: (data.total_amount ?? 0) + (data.shipping_cost ?? 0),
      shippingAddress: data.shipping?.address ?? {},
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      rawData: data,
    }
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    await this.http.put(`/products/${listingId}/stock`, { quantity })
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    await this.http.put(`/products/${listingId}/price`, { price })
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    const { data } = await this.http.get(`/products/${listingId}`)
    return {
      externalId: data.id,
      title: data.title,
      price: data.price ?? 0,
      stock: data.stock?.quantity ?? 0,
      status: data.status ?? 'active',
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    await this.http.post(`/orders/${orderId}/shipments`, {
      tracking_code: trackingCode,
      carrier,
      shipped_at: new Date().toISOString(),
    })
  }
}
