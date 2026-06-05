import axios from 'axios'
import { prisma } from '@sellsync/database'
import { getValidToken } from '../lib/token-refresher'

export type HealthStatus = 'ok' | 'token_expired' | 'error' | 'unconfigured'

export interface StoreHealth {
  storeId: string
  marketplace: string
  name: string
  status: HealthStatus
  latencyMs: number | null
  tokenExpiresAt: Date | null
  lastCheckedAt: Date
  errorMessage?: string
}

async function checkMercadoLivre(storeId: string, token: string): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now()
  await axios.get('https://api.mercadolibre.com/users/me', {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 8000,
  })
  return { ok: true, latencyMs: Date.now() - t0 }
}

async function checkShopee(storeId: string, token: string, shopId: string): Promise<{ ok: boolean; latencyMs: number }> {
  const { createHmac } = await import('node:crypto')
  const partnerId = process.env.SHOPEE_PARTNER_ID!
  const partnerKey = process.env.SHOPEE_PARTNER_KEY!
  const timestamp = Math.floor(Date.now() / 1000)
  const path = '/api/v2/shop/get_shop_info'
  const baseStr = `${partnerId}${path}${timestamp}${token}${shopId}`
  const sign = createHmac('sha256', partnerKey).update(baseStr).digest('hex')

  const t0 = Date.now()
  await axios.get(`https://partner.shopeemobile.com${path}`, {
    params: { partner_id: Number(partnerId), shop_id: Number(shopId), access_token: token, timestamp, sign },
    timeout: 8000,
  })
  return { ok: true, latencyMs: Date.now() - t0 }
}

async function pingGeneric(url: string): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now()
  await axios.get(url, { timeout: 8000 })
  return { ok: true, latencyMs: Date.now() - t0 }
}

const MARKETPLACE_PING: Record<string, string> = {
  AMAZON:     'https://sellingpartnerapi-na.amazon.com',
  MAGALU:     'https://api.magalu.com',
  AMERICANAS: 'https://api.skyhub.com.br',
  SHEIN:      'https://openapi.sheincorp.com',
  TIKTOK_SHOP:'https://open-api.tiktokglobalshop.com',
}

export async function checkStoreHealth(storeId: string): Promise<StoreHealth> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, marketplace: true, name: true, accessToken: true, refreshToken: true, tokenExpiry: true, externalId: true, isActive: true },
  })

  if (!store) throw new Error('Store not found')

  const base: Omit<StoreHealth, 'status' | 'latencyMs' | 'errorMessage'> = {
    storeId: store.id,
    marketplace: store.marketplace,
    name: store.name,
    tokenExpiresAt: store.tokenExpiry,
    lastCheckedAt: new Date(),
  }

  if (!store.isActive) return { ...base, status: 'unconfigured', latencyMs: null }

  try {
    const token = await getValidToken(storeId)

    let result: { ok: boolean; latencyMs: number }

    if (store.marketplace === 'MERCADO_LIVRE') {
      result = await checkMercadoLivre(storeId, token)
    } else if (store.marketplace === 'SHOPEE') {
      result = await checkShopee(storeId, token, store.externalId!)
    } else {
      const pingUrl = MARKETPLACE_PING[store.marketplace]
      result = pingUrl ? await pingGeneric(pingUrl) : { ok: true, latencyMs: 0 }
    }

    return { ...base, status: 'ok', latencyMs: result.latencyMs }
  } catch (err: any) {
    const msg = String(err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido')
    const status: HealthStatus = msg.toLowerCase().includes('token') || err?.response?.status === 401
      ? 'token_expired'
      : 'error'
    return { ...base, status, latencyMs: null, errorMessage: msg.slice(0, 200) }
  }
}

export async function checkAllStoresHealth(tenantId: string): Promise<StoreHealth[]> {
  const stores = await prisma.store.findMany({
    where: { tenantId, isActive: true },
    select: { id: true },
  })
  return Promise.all(stores.map((s) => checkStoreHealth(s.id)))
}
