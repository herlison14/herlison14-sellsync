import axios, { type AxiosInstance } from 'axios'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

const SP_API = 'https://sellingpartnerapi-na.amazon.com'
const LWA_URL = 'https://api.amazon.com/auth/o2/token'

export class AmazonAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(
    private clientId: string,
    private clientSecret: string,
    private refreshToken: string,
    private marketplaceId = 'A2Q3Y263D00KWC', // Brasil
  ) {
    this.http = axios.create({ baseURL: SP_API })
    this.http.interceptors.request.use(async (config) => {
      config.headers['x-amz-access-token'] = await this.getAccessToken()
      config.headers['Content-Type'] = 'application/json'
      return config
    })
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken

    const { data } = await axios.post(LWA_URL, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken!
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const { data } = await this.http.get(`/orders/v0/orders/${externalId}`)
    const order = data.payload

    const { data: itemsData } = await this.http.get(`/orders/v0/orders/${externalId}/orderItems`)
    const items = itemsData.payload?.OrderItems ?? []

    return {
      externalId: order.AmazonOrderId,
      status: order.OrderStatus,
      buyerName: order.BuyerInfo?.BuyerName ?? '',
      buyerEmail: order.BuyerInfo?.BuyerEmail,
      items: items.map((item: Record<string, unknown>) => {
        const i = item as {
          OrderItemId: string
          SellerSKU: string
          Title: string
          QuantityOrdered: number
          ItemPrice?: { Amount: string }
        }
        return {
          externalId: i.OrderItemId,
          sku: i.SellerSKU,
          name: i.Title,
          quantity: i.QuantityOrdered,
          unitPrice: Number(i.ItemPrice?.Amount ?? 0),
        }
      }),
      subtotal: Number(order.OrderTotal?.Amount ?? 0),
      shippingCost: 0,
      total: Number(order.OrderTotal?.Amount ?? 0),
      shippingAddress: order.ShippingAddress ?? {},
      paidAt: order.PurchaseDate ? new Date(order.PurchaseDate) : undefined,
      rawData: order,
    }
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    await this.http.put(
      `/listings/2021-08-01/items/${encodeURIComponent(listingId)}`,
      {
        productType: 'PRODUCT',
        patches: [{
          op: 'replace',
          path: '/attributes/fulfillment_availability',
          value: [{ fulfillment_channel_code: 'DEFAULT', quantity }],
        }],
      },
      { params: { marketplaceIds: this.marketplaceId } },
    )
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    await this.http.put(
      `/listings/2021-08-01/items/${encodeURIComponent(listingId)}`,
      {
        productType: 'PRODUCT',
        patches: [{
          op: 'replace',
          path: '/attributes/purchasable_offer',
          value: [{ marketplace_id: this.marketplaceId, currency: 'BRL', our_price: [{ schedule: [{ value_with_tax: price }] }] }],
        }],
      },
      { params: { marketplaceIds: this.marketplaceId } },
    )
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    const { data } = await this.http.get(
      `/listings/2021-08-01/items/${encodeURIComponent(listingId)}`,
      { params: { marketplaceIds: this.marketplaceId, includedData: 'summaries,attributes' } },
    )
    return {
      externalId: data.sku,
      title: data.summaries?.[0]?.itemName ?? listingId,
      price: 0,
      stock: 0,
      status: data.summaries?.[0]?.status?.[0] ?? 'unknown',
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    const { data: itemsData } = await this.http.get(`/orders/v0/orders/${orderId}/orderItems`)
    const items = itemsData.payload?.OrderItems ?? []

    await this.http.post('/shipping/v1/shipments', {
      clientReferenceId: orderId,
      shipTo: {},
      shipFrom: {},
      containers: [{
        containerType: 'PACKAGE',
        dimensions: { length: 10, width: 10, height: 10, unit: 'CM' },
        weight: { value: 0.5, unit: 'KG' },
        items: items.map((i: { SellerSKU: string; QuantityOrdered: number }) => ({
          orderItemId: i.SellerSKU,
          quantity: i.QuantityOrdered,
        })),
        trackingId: trackingCode,
      }],
    })
  }
}
