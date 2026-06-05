import axios, { type AxiosInstance } from 'axios'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

// Americanas usa a API Skyhub (plataforma unificada Americanas/Submarino/Shoptime)
const SKYHUB_API = 'https://api.skyhub.com.br'

export class AmericanasAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance

  constructor(
    private email: string,
    private token: string,
    private accountManagerEmail: string,
  ) {
    this.http = axios.create({
      baseURL: SKYHUB_API,
      headers: {
        'X-User-Email': email,
        'X-Api-Key': token,
        'X-Accountmanager-Key': accountManagerEmail,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const { data } = await this.http.get(`/orders/${externalId}`)
    const order = data.order

    return {
      externalId: order.code,
      status: order.status?.type ?? 'payment_received',
      buyerName: order.customer?.name ?? '',
      buyerEmail: order.customer?.email,
      items: (order.items ?? []).map((item: Record<string, unknown>) => {
        const i = item as { product_id: string; id: string; name: string; qty: number; original_price: number }
        return {
          externalId: i.product_id,
          sku: i.id,
          name: i.name,
          quantity: i.qty,
          unitPrice: i.original_price,
        }
      }),
      subtotal: order.subtotal ?? 0,
      shippingCost: order.shipping_cost ?? 0,
      total: order.total_ordered ?? 0,
      shippingAddress: {
        street: order.shipping_address?.street ?? '',
        number: order.shipping_address?.number ?? '',
        city: order.shipping_address?.city ?? '',
        state: order.shipping_address?.region ?? '',
        postalCode: order.shipping_address?.postcode ?? '',
      },
      paidAt: order.date_time ? new Date(order.date_time) : undefined,
      rawData: order,
    }
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    await this.http.put(`/products/${listingId}`, {
      product: { qty: quantity },
    })
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    await this.http.put(`/products/${listingId}`, {
      product: { price, promotional_price: price },
    })
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    const { data } = await this.http.get(`/products/${listingId}`)
    const p = data.product
    return {
      externalId: p.sku ?? listingId,
      title: p.name,
      price: p.price ?? 0,
      stock: p.qty ?? 0,
      status: p.status ?? 'enabled',
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    // Americanas exige criação de shipment e depois envio de tracking
    await this.http.post(`/orders/${orderId}/shipments`, {
      shipment: {
        code: orderId,
        tracks: [{
          code: trackingCode,
          carrier,
          method: 'Normal',
          direction: 'DR',
        }],
        items: [],
      },
    })
  }
}
