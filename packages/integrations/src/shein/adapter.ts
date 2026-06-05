import axios, { type AxiosInstance } from 'axios'
import crypto from 'node:crypto'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

// Shein usa a Shein Open Platform API (acesso via seller portal)
const SHEIN_API = 'https://openapi.sheinglobal.com'

export class SheinAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance

  constructor(
    private appKey: string,
    private appSecret: string,
    private accessToken: string,
  ) {
    this.http = axios.create({ baseURL: SHEIN_API })
  }

  private sign(params: Record<string, string | number>, timestamp: number): string {
    const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('')
    return crypto.createHmac('sha256', this.appSecret).update(`${this.appKey}${sorted}${timestamp}`).digest('hex').toUpperCase()
  }

  private baseParams(timestamp = Math.floor(Date.now() / 1000)) {
    return {
      app_key: this.appKey,
      access_token: this.accessToken,
      timestamp,
      format: 'json',
      v: '1.0',
    }
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const timestamp = Math.floor(Date.now() / 1000)
    const params = { ...this.baseParams(timestamp), order_no: externalId }
    const sign = this.sign(params, timestamp)

    const { data } = await this.http.get('/open/order/detail', {
      params: { ...params, sign },
    })

    const order = data.result ?? data

    return {
      externalId: order.order_no ?? externalId,
      status: order.order_status ?? 'processing',
      buyerName: order.customer_name ?? '',
      items: (order.product_list ?? []).map((item: Record<string, unknown>) => {
        const i = item as { goods_id: string; sku_code: string; goods_name: string; num: number; price: number }
        return {
          externalId: String(i.goods_id),
          sku: i.sku_code,
          name: i.goods_name,
          quantity: i.num,
          unitPrice: i.price,
        }
      }),
      subtotal: Number(order.goods_amount ?? 0),
      shippingCost: Number(order.freight_amount ?? 0),
      total: Number(order.order_amount ?? 0),
      shippingAddress: order.shipping_address ?? {},
      rawData: order,
    }
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000)
    const params = { ...this.baseParams(timestamp), sku_code: listingId, num: quantity }
    const sign = this.sign(params, timestamp)
    await this.http.post('/open/product/update_stock', { ...params, sign })
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000)
    const params = { ...this.baseParams(timestamp), sku_code: listingId, price: price.toFixed(2) }
    const sign = this.sign(params, timestamp)
    await this.http.post('/open/product/update_price', { ...params, sign })
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    const timestamp = Math.floor(Date.now() / 1000)
    const params = { ...this.baseParams(timestamp), goods_id: listingId }
    const sign = this.sign(params, timestamp)
    const { data } = await this.http.get('/open/product/detail', { params: { ...params, sign } })
    const p = data.result ?? data
    return {
      externalId: String(p.goods_id ?? listingId),
      title: p.goods_name ?? listingId,
      price: Number(p.price ?? 0),
      stock: Number(p.stock ?? 0),
      status: p.on_sale ? 'active' : 'inactive',
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000)
    const params = {
      ...this.baseParams(timestamp),
      order_no: orderId,
      logistics_no: trackingCode,
      express_company: carrier,
    }
    const sign = this.sign(params, timestamp)
    await this.http.post('/open/order/ship', { ...params, sign })
  }
}
