export interface MarketplaceOrder {
  externalId: string
  status: string
  buyerName: string
  buyerEmail?: string
  items: Array<{
    externalId: string
    sku: string
    name: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  shippingCost: number
  total: number
  shippingAddress: Record<string, unknown>
  paidAt?: Date
  rawData: Record<string, unknown>
}

export interface MarketplaceListing {
  externalId: string
  title: string
  price: number
  stock: number
  status: string
}

export interface IMarketplaceAdapter {
  getOrder(externalId: string): Promise<MarketplaceOrder>
  updateStock(listingId: string, quantity: number): Promise<void>
  updatePrice(listingId: string, price: number): Promise<void>
  getListing(listingId: string): Promise<MarketplaceListing>
  confirmShipment(orderId: string, trackingCode: string, carrier: string): Promise<void>
}
