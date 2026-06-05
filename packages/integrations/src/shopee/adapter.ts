import axios, { type AxiosInstance } from 'axios'
import crypto from 'node:crypto'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

const SHOPEE_API = 'https://partner.shopeemobile.com/api/v2'

export class ShopeeAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance

  constructor(
    private partnerId: string,
    private partnerKey: string,
    private shopId: string,
    private accessToken: string,
  ) {
    this.http = axios.create({ baseURL: SHOPEE_API })
  }

  private sign(path: string, timestamp: number): string {
    const base = `${this.partnerId}${path}${timestamp}${this.accessToken}${this.shopId}`
    return crypto.createHmac('sha256', this.partnerKey).update(base).digest('hex')
  }

  private params(path: string) {
    const timestamp = Math.floor(Date.now() / 1000)
    return {
      partner_id: Number(this.partnerId),
      shop_id: Number(this.shopId),
      access_token: this.accessToken,
      timestamp,
      sign: this.sign(path, timestamp),
    }
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const path = '/order/get_order_detail'
    const { data } = await this.http.get(path, {
      params: { ...this.params(path), order_sn: externalId, response_optional_fields: 'buyer_username,recipient_address' },
    })

    const order = data.response.order_list[0]
    return {
      externalId: order.order_sn,
      status: order.order_status,
      buyerName: order.buyer_username,
      items: (order.item_list ?? []).map((item: Record<string, unknown>) => {
        const i = item as { item_id: string; item_sku: string; item_name: string; model_quantity_purchased: number; model_discounted_price: number }
        return {
          externalId: String(i.item_id),
          sku: i.item_sku ?? String(i.item_id),
          name: i.item_name,
          quantity: i.model_quantity_purchased,
          unitPrice: i.model_discounted_price,
        }
      }),
      subtotal: order.total_amount,
      shippingCost: 0,
      total: order.total_amount,
      shippingAddress: order.recipient_address ?? {},
      rawData: order,
    }
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    const path = '/product/update_stock'
    await this.http.post(path, {
      item_id: Number(listingId),
      stock_list: [{ model_id: 0, seller_stock: [{ stock: quantity }] }],
    }, { params: this.params(path) })
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    const path = '/product/update_price'
    await this.http.post(path, {
      item_id: Number(listingId),
      price_list: [{ model_id: 0, original_price: price }],
    }, { params: this.params(path) })
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    const path = '/product/get_item_base_info'
    const { data } = await this.http.get(path, {
      params: { ...this.params(path), item_id_list: listingId },
    })
    const item = data.response.item_list[0]
    return {
      externalId: String(item.item_id),
      title: item.item_name,
      price: item.price_info?.[0]?.original_price ?? 0,
      stock: item.stock_info_v2?.summary_info?.total_available_stock ?? 0,
      status: item.item_status,
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, _carrier: string): Promise<void> {
    const path = '/logistics/ship_order'
    await this.http.post(path, {
      order_sn: orderId,
      pickup: { tracking_no: trackingCode },
    }, { params: this.params(path) })
  }
}
