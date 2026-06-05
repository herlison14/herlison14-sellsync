import axios, { type AxiosInstance } from 'axios'

const NFEIO_API = 'https://api.nfe.io/v1'

export interface NFeItem {
  cfop: string
  ncm: string
  description: string
  quantity: number
  unitValue: number
  unitOfMeasure: string
  taxes: {
    icms?: { cst: string; rate?: number; baseValue?: number }
    pis?: { cst: string; rate?: number }
    cofins?: { cst: string; rate?: number }
  }
}

export interface NFePayload {
  nature: string
  accessKey?: string
  cfop: string
  recipientDocument: string
  recipientName: string
  recipientEmail?: string
  recipientAddress: {
    street: string
    number: string
    district: string
    city: string
    state: string
    postalCode: string
    country?: string
  }
  items: NFeItem[]
  transport: {
    modality: 'sem_frete' | 'por_conta_emitente' | 'por_conta_destinatario'
    freight?: number
  }
  payment: {
    type: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'pix' | 'outros'
    total: number
  }
}

export interface NFeResult {
  id: string
  status: 'created' | 'processing' | 'issued' | 'cancelled' | 'error'
  accessKey?: string
  number?: string
  series?: string
  issuedAt?: string
  pdfUrl?: string
  xmlUrl?: string
  errorMessage?: string
}

export class NFeIoClient {
  private http: AxiosInstance

  constructor(private apiKey: string, private companyId: string) {
    this.http = axios.create({
      baseURL: NFEIO_API,
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async emit(payload: NFePayload): Promise<NFeResult> {
    const { data } = await this.http.post(`/companies/${this.companyId}/nfe`, this.mapPayload(payload))
    return this.mapResult(data.nfe ?? data)
  }

  async getStatus(nfeId: string): Promise<NFeResult> {
    const { data } = await this.http.get(`/companies/${this.companyId}/nfe/${nfeId}`)
    return this.mapResult(data.nfe ?? data)
  }

  async cancel(nfeId: string, reason: string): Promise<NFeResult> {
    const { data } = await this.http.delete(`/companies/${this.companyId}/nfe/${nfeId}`, {
      data: { reason },
    })
    return this.mapResult(data.nfe ?? data)
  }

  async getPdf(nfeId: string): Promise<Buffer> {
    const { data } = await this.http.get(`/companies/${this.companyId}/nfe/${nfeId}/pdf`, {
      responseType: 'arraybuffer',
    })
    return Buffer.from(data)
  }

  private mapPayload(p: NFePayload) {
    return {
      nature: p.nature,
      cfop: p.cfop,
      recipient: {
        federalTaxNumber: p.recipientDocument.replace(/\D/g, ''),
        name: p.recipientName,
        email: p.recipientEmail,
        address: {
          street: p.recipientAddress.street,
          number: p.recipientAddress.number,
          district: p.recipientAddress.district,
          city: { name: p.recipientAddress.city },
          state: p.recipientAddress.state,
          postalCode: p.recipientAddress.postalCode.replace(/\D/g, ''),
          country: p.recipientAddress.country ?? 'BR',
        },
      },
      items: p.items.map((item, i) => ({
        cEan: '',
        xProd: item.description,
        ncm: item.ncm.replace(/\D/g, ''),
        cfop: item.cfop,
        uCom: item.unitOfMeasure,
        qCom: item.quantity,
        vUnCom: item.unitValue,
        vProd: item.quantity * item.unitValue,
        nItemPed: String(i + 1),
        taxes: item.taxes,
      })),
      transport: {
        modality: p.transport.modality,
        freight: p.transport.freight,
      },
      payment: [{
        type: p.payment.type,
        amount: p.payment.total,
      }],
    }
  }

  private mapResult(raw: Record<string, unknown>): NFeResult {
    return {
      id: raw.id as string,
      status: raw.status as NFeResult['status'],
      accessKey: raw.accessKey as string | undefined,
      number: raw.number as string | undefined,
      series: raw.serie as string | undefined,
      issuedAt: raw.issuedAt as string | undefined,
      pdfUrl: (raw.links as Record<string, string>)?.pdf,
      xmlUrl: (raw.links as Record<string, string>)?.xml,
      errorMessage: raw.errorMessage as string | undefined,
    }
  }
}
