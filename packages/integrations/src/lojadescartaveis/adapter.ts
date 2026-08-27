import axios, { type AxiosInstance } from 'axios'
import type { IMarketplaceAdapter, MarketplaceOrder, MarketplaceListing } from '../base/adapter'

// Canal próprio (HC Magazine, loja-descartaveis) — primeira parte, sem
// OAuth: um bearer token fixo já basta (mesmo padrão do AmericanasAdapter).
// `listingId` aqui é sempre o SKU da variação, usado direto na URL.
export class LojaDescartaveisAdapter implements IMarketplaceAdapter {
  private http: AxiosInstance

  constructor(baseUrl: string, apiToken: string) {
    this.http = axios.create({
      baseURL: `${baseUrl}/api/sellsync`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  async getOrder(externalId: string): Promise<MarketplaceOrder> {
    const { data } = await this.http.get(`/orders/${externalId}`)
    return data as MarketplaceOrder
  }

  async updateStock(listingId: string, quantity: number): Promise<void> {
    await this.http.patch(`/variants/${listingId}/stock`, { quantity })
  }

  async updatePrice(listingId: string, price: number): Promise<void> {
    await this.http.patch(`/variants/${listingId}/price`, { price })
  }

  async getListing(listingId: string): Promise<MarketplaceListing> {
    // Não existe uma rota "uma variação só" na loja — busca a lista
    // completa (mesma usada pra importar o catálogo) e filtra pelo SKU.
    // Método não usado em nenhum caminho quente hoje (mesma situação de
    // todo adaptador existente — só precisa satisfazer a interface).
    const { data } = await this.http.get('/variants')
    const variants = data as Array<{
      sku: string
      name: string
      price: number
      quantity_on_hand: number
      is_active: boolean
    }>
    const v = variants.find((x) => x.sku === listingId)
    if (!v) throw new Error(`Variação ${listingId} não encontrada na loja`)
    return {
      externalId: v.sku,
      title: v.name,
      price: v.price,
      stock: v.quantity_on_hand,
      status: v.is_active ? 'ACTIVE' : 'INACTIVE',
    }
  }

  async confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    await this.http.patch(`/orders/${orderId}/shipment`, { trackingCode, carrier })
  }
}
