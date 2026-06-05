import { prisma } from '@sellsync/database'
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns'

export class ReportsService {
  async overview(tenantId: string, from: Date, to: Date) {
    const [orders, cancelled] = await Promise.all([
      prisma.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: from, lte: to },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        select: { total: true, shippingCost: true, marketplace: true, createdAt: true },
      }),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: from, lte: to }, status: 'CANCELLED' },
      }),
    ])

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0)
    const totalShipping = orders.reduce((s, o) => s + Number(o.shippingCost), 0)
    const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0

    // Receita por marketplace
    const byMarketplace: Record<string, { orders: number; revenue: number }> = {}
    for (const order of orders) {
      const mp = order.marketplace
      if (!byMarketplace[mp]) byMarketplace[mp] = { orders: 0, revenue: 0 }
      byMarketplace[mp].orders++
      byMarketplace[mp].revenue += Number(order.total)
    }

    return {
      totalOrders: orders.length,
      totalCancelled: cancelled,
      totalRevenue,
      totalShipping,
      averageTicket,
      byMarketplace,
    }
  }

  async dailySales(tenantId: string, days = 30) {
    const to = endOfDay(new Date())
    const from = startOfDay(subDays(new Date(), days - 1))

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      select: { total: true, createdAt: true, marketplace: true },
    })

    // Preenche todos os dias do período (incluindo dias sem vendas)
    const days_range = eachDayOfInterval({ start: from, end: to })
    const map: Record<string, { date: string; orders: number; revenue: number }> = {}

    for (const day of days_range) {
      const key = format(day, 'yyyy-MM-dd')
      map[key] = { date: key, orders: 0, revenue: 0 }
    }

    for (const order of orders) {
      const key = format(order.createdAt, 'yyyy-MM-dd')
      if (map[key]) {
        map[key].orders++
        map[key].revenue += Number(order.total)
      }
    }

    return Object.values(map)
  }

  async topProducts(tenantId: string, from: Date, to: Date, limit = 10) {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          createdAt: { gte: from, lte: to },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
      },
    })

    const grouped: Record<string, { productId: string; sku: string; name: string; totalQty: number; totalRevenue: number }> = {}

    for (const item of items) {
      const key = item.product?.id ?? item.sku
      if (!grouped[key]) {
        grouped[key] = {
          productId: item.product?.id ?? '',
          sku: item.sku,
          name: item.name,
          totalQty: 0,
          totalRevenue: 0,
        }
      }
      grouped[key].totalQty += item.quantity
      grouped[key].totalRevenue += Number(item.total)
    }

    return Object.values(grouped)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
  }

  async nfeSummary(tenantId: string, from: Date, to: Date) {
    const [authorized, pending, rejected, cancelled] = await Promise.all([
      prisma.order.count({ where: { tenantId, createdAt: { gte: from, lte: to }, nfeStatus: 'AUTHORIZED' } }),
      prisma.order.count({ where: { tenantId, createdAt: { gte: from, lte: to }, nfeStatus: 'PENDING' } }),
      prisma.order.count({ where: { tenantId, createdAt: { gte: from, lte: to }, nfeStatus: 'REJECTED' } }),
      prisma.order.count({ where: { tenantId, createdAt: { gte: from, lte: to }, nfeStatus: 'CANCELLED' } }),
    ])

    return { authorized, pending, rejected, cancelled, total: authorized + pending + rejected + cancelled }
  }
}
