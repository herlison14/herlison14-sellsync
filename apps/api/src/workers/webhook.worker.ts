import type { Job } from 'bullmq'
import { prisma } from '@sellsync/database'
import { MarketplaceAdapterFactory } from '@sellsync/integrations'
import { orderQueue } from './queues'

export async function processWebhook(job: Job) {
  const { name, data } = job

  if (name === 'ml-notification') {
    const { topic, resource, user_id } = data as { topic: string; resource: string; user_id: number }

    const store = await prisma.store.findFirst({
      where: { marketplace: 'MERCADO_LIVRE', externalId: String(user_id) },
    })
    if (!store) return

    if (topic === 'orders_v2') {
      const orderId = resource.replace('/orders/', '')
      await orderQueue.add('import-ml-order', { storeId: store.id, externalId: orderId })
    }

    if (topic === 'items') {
      // Handle item/listing update
    }
  }

  if (name === 'shopee-notification') {
    const { code, shop_id, order_sn_list } = data as { code: number; shop_id: number; order_sn_list?: string[] }

    const store = await prisma.store.findFirst({
      where: { marketplace: 'SHOPEE', externalId: String(shop_id) },
    })
    if (!store) return

    // code 3 = new order
    if (code === 3 && order_sn_list) {
      for (const sn of order_sn_list) {
        await orderQueue.add('import-shopee-order', { storeId: store.id, externalId: sn })
      }
    }
  }

  // Canal próprio: o payload JÁ é o pedido completo (não um "avise que
  // aconteceu algo, venha buscar depois" como ML/Shopee) — integração de
  // primeira parte, não precisa do round-trip extra de ir buscar o pedido
  // de volta na loja, e continua funcionando mesmo se a loja cair logo
  // depois de enviar o webhook.
  //
  // LIMITAÇÃO CONHECIDA: a loja usa um único segredo compartilhado
  // (SELLSYNC_WEBHOOK_TOKEN/URL, fixo por env var) pra avisar UM SellSync
  // — o webhook não carrega nenhum identificador de tenant. isActive:true
  // evita pegar uma conexão desativada por engano, mas se DOIS tenants
  // tiverem esse canal conectado e ATIVO ao mesmo tempo, ainda é ambíguo
  // (pega o primeiro que o banco devolver). Esse desenho assume "uma loja,
  // um tenant gerenciando ela" — múltiplos tenants ativos simultâneos não
  // é um caso suportado hoje.
  if (name === 'lojadescartaveis-notification') {
    const store = await prisma.store.findFirst({
      where: { marketplace: 'LOJA_DESCARTAVEIS', isActive: true },
    })
    if (!store) return

    await orderQueue.add('import-lojadescartaveis-order', { storeId: store.id, orderPayload: data })
  }
}
