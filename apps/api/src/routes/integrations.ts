import type { FastifyInstance } from 'fastify'
import axios from 'axios'
import { prisma } from '@sellsync/database'
import { z } from 'zod'
import { checkAllStoresHealth, checkStoreHealth } from '../services/health.service'

export async function integrationsRoutes(app: FastifyInstance) {
  // ─── Mercado Livre OAuth ───────────────────────────────────────────────────

  app.get('/mercadolivre/connect', async (req, reply) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64url')

    const url = new URL('https://auth.mercadolivre.com.br/authorization')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', process.env.ML_APP_ID!)
    url.searchParams.set('redirect_uri', process.env.ML_REDIRECT_URI!)
    url.searchParams.set('state', state)

    return reply.redirect(url.toString())
  })

  app.get('/mercadolivre/callback', async (req, reply) => {
    const { code, state } = req.query as { code: string; state: string }
    const { tenantId } = JSON.parse(Buffer.from(state, 'base64url').toString())

    const { data: tokens } = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      code,
      redirect_uri: process.env.ML_REDIRECT_URI,
    })

    const { data: me } = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    await prisma.store.upsert({
      where: { tenantId_marketplace_externalId: { tenantId, marketplace: 'MERCADO_LIVRE', externalId: String(me.id) } },
      create: {
        tenantId,
        marketplace: 'MERCADO_LIVRE',
        name: me.nickname,
        externalId: String(me.id),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true,
      },
    })

    return reply.redirect(`${process.env.WEB_URL}/dashboard/integrations?connected=mercadolivre`)
  })

  // ─── Shopee OAuth ─────────────────────────────────────────────────────────

  app.get('/shopee/connect', async (req, reply) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/shop/auth_partner'
    const baseStr = `${process.env.SHOPEE_PARTNER_ID}${path}${timestamp}`

    const { createHmac } = await import('node:crypto')
    const sign = createHmac('sha256', process.env.SHOPEE_PARTNER_KEY!).update(baseStr).digest('hex')

    const url = new URL('https://partner.shopeemobile.com/api/v2/shop/auth_partner')
    url.searchParams.set('partner_id', process.env.SHOPEE_PARTNER_ID!)
    url.searchParams.set('timestamp', String(timestamp))
    url.searchParams.set('sign', sign)
    url.searchParams.set('redirect', `${process.env.API_URL}/integrations/shopee/callback?tenantId=${tenantId}`)

    return reply.redirect(url.toString())
  })

  app.get('/shopee/callback', async (req, reply) => {
    const { code, shop_id, tenantId } = req.query as { code: string; shop_id: string; tenantId: string }
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/auth/token/get'
    const baseStr = `${process.env.SHOPEE_PARTNER_ID}${path}${timestamp}`

    const { createHmac } = await import('node:crypto')
    const sign = createHmac('sha256', process.env.SHOPEE_PARTNER_KEY!).update(baseStr).digest('hex')

    const { data: tokens } = await axios.post('https://partner.shopeemobile.com/api/v2/auth/token/get', {
      code,
      shop_id: Number(shop_id),
      partner_id: Number(process.env.SHOPEE_PARTNER_ID),
    }, { params: { partner_id: process.env.SHOPEE_PARTNER_ID, timestamp, sign } })

    const { data: shopInfo } = await axios.get('https://partner.shopeemobile.com/api/v2/shop/get_shop_info', {
      params: {
        partner_id: Number(process.env.SHOPEE_PARTNER_ID),
        shop_id: Number(shop_id),
        access_token: tokens.access_token,
        timestamp,
        sign,
      },
    })

    await prisma.store.upsert({
      where: { tenantId_marketplace_externalId: { tenantId, marketplace: 'SHOPEE', externalId: shop_id } },
      create: {
        tenantId,
        marketplace: 'SHOPEE',
        name: shopInfo.response?.shop_name ?? `Shopee ${shop_id}`,
        externalId: shop_id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expire_in * 1000),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expire_in * 1000),
        isActive: true,
      },
    })

    return reply.redirect(`${process.env.WEB_URL}/dashboard/integrations?connected=shopee`)
  })

  // ─── Listar lojas conectadas ──────────────────────────────────────────────

  app.get('/stores', async (req) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    return prisma.store.findMany({
      where: { tenantId },
      select: { id: true, marketplace: true, name: true, isActive: true, createdAt: true },
    })
  })

  app.delete('/stores/:id', async (req) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    const { id } = req.params as { id: string }
    return prisma.store.update({
      where: { id, tenantId },
      data: { isActive: false },
    })
  })

  // ─── Health check ─────────────────────────────────────────────────────────

  app.get('/health', async (req) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    return checkAllStoresHealth(tenantId)
  })

  app.get('/health/:storeId', async (req) => {
    await req.jwtVerify()
    const { storeId } = req.params as { storeId: string }
    return checkStoreHealth(storeId)
  })
}
