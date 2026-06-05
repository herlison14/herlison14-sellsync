import axios, { type AxiosInstance } from 'axios'
import crypto from 'node:crypto'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

// TikTok Shop Open Platform API v2
const TIKTOK_API = 'https://open-api.tiktokglobalshop.com'

export class TikTokShopAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance

  constructor(
    private appKey: string,
    private appSecret: string,
    private accessToken: string,
    private shopId: string,
  ) {
    this.http = axios.create({ baseURL: TIKTOK_API })
  }

  private sign(path: string, params: Record<string, string | number>, body: string, timestamp: number): string {
    const sortedParams = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('')
    const baseStr = `${this.appSecret}${path}${sortedParams}${body}${timestamp}`
    return crypto.createHmac('sha256', this.appSecret).update(baseStr).digest('hex')
  }

  private commonParams(timestamp = Math.floor(Date.now() / 1000)) {
    return {
      app_key: this.appKey,
      access_token: this.accessToken,
      shop_id: this.shopId,
      timestamp,
      version: '202309',
    }
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const path = '/order/202309/orders'
    const timestamp = Math.floor(Date.now() / 1000)
    const params = { ...this.commonParams(timestamp), order_id_list: externalId }
    const sign = this.sign(path, params, '', timestamp)

    const { data } = await this.http.get(path, { params: { ...params, sign } })
    const order = data.data?.order_list?.[0] ?? {}

    return {
      externalId: order.order_id ?? externalId,
      status: order.order_status ?? 'UNPAID',
      buyerName: order.recipient_address?.name ?? '',
      items: (order.line_items ?? []).map((item: Record<string, unknown>) => {
        const i = item as { sku_id: string; seller_sku: string; product_name: string; quantity: number; sku_sale_price: string }
        return {
          externalId: i.sku_id,
          sku: i.seller_sku,
          name: i.product_name,
          quantity: i.quantity,
          unitPrice: Number(i.sku_sale_price),
        }
      }),
      subtotal: Number(order.payment?.sub_total ?? 0),
      shippingCost: Number(order.payment?.shipping_fee ?? 0),
      total: Number(order.payment?.total_amount ?? 0),
      shippingAddress: order.recipient_address ?? {},
      paidAt: order.paid_time ? new Date(Number(order.paid_time) * 1000) : undefined,
      rawData: order,
    }
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    const path = '/product/202309/inventory'
    const timestamp = Math.floor(Date.now() / 1000)
    const body = JSON.stringify({ skus: [{ id: listingId, inventory: [{ warehouse_id: this.shopId, quantity }] }] })
    const params = this.commonParams(timestamp)
    const sign = this.sign(path, params, body, timestamp)

    await this.http.put(path, JSON.parse(body), { params: { ...params, sign } })
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    const path = '/product/202309/prices'
    const timestamp = Math.floor(Date.now() / 1000)
    const body = JSON.stringify({ skus: [{ id: listingId, sale_price: price.toFixed(2) }] })
    const params = this.commonParams(timestamp)
    const sign = this.sign(path, params, body, timestamp)

    await this.http.put(path, JSON.parse(body), { params: { ...params, sign } })
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    const path = `/product/202309/products/${listingId}`
    const timestamp = Math.floor(Date.now() / 1000)
    const params = this.commonParams(timestamp)
    const sign = this.sign(path, params, '', timestamp)

    const { data } = await this.http.get(path, { params: { ...params, sign } })
    const p = data.data ?? {}

    return {
      externalId: p.id ?? listingId,
      title: p.title ?? listingId,
      price: Number(p.skus?.[0]?.sale_price ?? 0),
      stock: p.skus?.[0]?.inventory?.[0]?.quantity ?? 0,
      status: p.status === 2 ? 'active' : 'inactive',
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    const path = '/fulfillment/202309/packages/ship'
    const timestamp = Math.floor(Date.now() / 1000)
    const body = JSON.stringify({
      order_id: orderId,
      tracking_number: trackingCode,
      shipping_provider_id: carrier,
    })
    const params = this.commonParams(timestamp)
    const sign = this.sign(path, params, body, timestamp)

    await this.http.post(path, JSON.parse(body), { params: { ...params, sign } })
  }
}
