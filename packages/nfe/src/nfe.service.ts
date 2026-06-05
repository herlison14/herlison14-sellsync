import { prisma } from '@sellsync/database'
import { NFeIoClient } from './nfeio.client'
import type { NFeItem } from './nfeio.client'

// CFOP padrão para venda de mercadoria para consumidor final (operação interna)
const CFOP_VENDA_INTERNA = '5102'
const CFOP_VENDA_INTERESTADUAL = '6102'

export class NFeService {
  private getClient(apiKey: string, companyId: string) {
    return new NFeIoClient(apiKey, companyId)
  }

  async emitForOrder(orderId: string, tenantId: string): Promise<string> {
    const [order, settings] = await Promise.all([
      prisma.order.findFirstOrThrow({
        where: { id: orderId, tenantId },
        include: { items: { include: { product: true } } },
      }),
      prisma.nfeSettings.findUniqueOrThrow({ where: { tenantId } }),
    ])

    if (!process.env.NFEIO_API_KEY || !process.env.NFEIO_COMPANY_ID) {
      throw new Error('NFe.io não configurado. Defina NFEIO_API_KEY e NFEIO_COMPANY_ID no .env')
    }

    const client = this.getClient(process.env.NFEIO_API_KEY, process.env.NFEIO_COMPANY_ID)

    const addr = (order.shippingAddr ?? {}) as Record<string, string>
    const uf = addr.state ?? addr.uf ?? 'SP'
    const cfop = uf === settings.uf ? CFOP_VENDA_INTERNA : CFOP_VENDA_INTERESTADUAL

    const items: NFeItem[] = order.items.map((item) => ({
      cfop,
      ncm: item.product?.ncm ?? '00000000',
      description: item.name,
      quantity: item.quantity,
      unitValue: Number(item.unitPrice),
      unitOfMeasure: 'UN',
      taxes: {
        icms: { cst: settings.crt === 1 ? '400' : '00' },
        pis:  { cst: '07' },
        cofins: { cst: '07' },
      },
    }))

    const result = await client.emit({
      nature: 'Venda de mercadoria',
      cfop,
      recipientDocument: order.buyerDocument ?? '000.000.000-00',
      recipientName: order.buyerName ?? 'Consumidor Final',
      recipientEmail: order.buyerEmail ?? undefined,
      recipientAddress: {
        street: addr.street ?? addr.logradouro ?? 'Rua não informada',
        number: addr.number ?? addr.numero ?? 'S/N',
        district: addr.district ?? addr.bairro ?? 'Centro',
        city: addr.city ?? addr.cidade ?? 'São Paulo',
        state: uf,
        postalCode: addr.postalCode ?? addr.cep ?? '00000-000',
      },
      items,
      transport: {
        modality: 'por_conta_emitente',
        freight: Number(order.shippingCost ?? 0),
      },
      payment: {
        type: 'outros',
        total: Number(order.total),
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: {
        nfeKey: result.accessKey ?? result.id,
        nfeStatus: result.status === 'issued' ? 'AUTHORIZED' : 'PENDING',
      },
    })

    return result.id
  }

  async pollStatus(orderId: string, nfeId: string) {
    if (!process.env.NFEIO_API_KEY || !process.env.NFEIO_COMPANY_ID) return

    const client = this.getClient(process.env.NFEIO_API_KEY, process.env.NFEIO_COMPANY_ID)
    const result = await client.getStatus(nfeId)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        nfeKey: result.accessKey ?? result.id,
        nfeStatus: result.status === 'issued' ? 'AUTHORIZED'
          : result.status === 'cancelled' ? 'CANCELLED'
          : result.status === 'error' ? 'REJECTED'
          : 'PENDING',
      },
    })

    return result
  }

  async getPdf(nfeId: string): Promise<Buffer> {
    const client = this.getClient(process.env.NFEIO_API_KEY!, process.env.NFEIO_COMPANY_ID!)
    return client.getPdf(nfeId)
  }

  async cancel(orderId: string, tenantId: string, reason: string) {
    const order = await prisma.order.findFirstOrThrow({ where: { id: orderId, tenantId } })
    if (!order.nfeKey) throw new Error('Pedido sem NF-e emitida')

    const client = this.getClient(process.env.NFEIO_API_KEY!, process.env.NFEIO_COMPANY_ID!)
    const result = await client.cancel(order.nfeKey, reason)

    await prisma.order.update({
      where: { id: orderId },
      data: { nfeStatus: 'CANCELLED' },
    })

    return result
  }
}
