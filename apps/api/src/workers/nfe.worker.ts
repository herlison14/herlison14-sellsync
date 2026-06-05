import type { Job } from 'bullmq'
import { prisma } from '@sellsync/database'
// Usar SDK externo: NFe.io ou TecnoSpeed Plug4Market
// npm install nfe-io-client
// A emissão de NF-e não deve ser construída do zero — use provider certificado

export async function processNfe(job: Job<{ orderId: string; tenantId: string }>) {
  const { orderId, tenantId } = job.data

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  })

  const settings = await prisma.nfeSettings.findUniqueOrThrow({ where: { tenantId } })

  // TODO: Integrate with NFe.io SDK or TecnoSpeed Plug4Market
  // Example with NFe.io:
  // const nfe = new NFeClient({ apiKey: process.env.NFEIO_API_KEY })
  // const result = await nfe.emit({
  //   cnpj: settings.cnpj,
  //   items: order.items.map(buildNfeItem),
  //   buyer: { name: order.buyerName, document: order.buyerDocument },
  //   total: order.total,
  // })

  // Update order with NF-e key
  await prisma.order.update({
    where: { id: orderId },
    data: {
      nfeStatus: 'PENDING',
      // nfeKey: result.accessKey,
    },
  })
}
