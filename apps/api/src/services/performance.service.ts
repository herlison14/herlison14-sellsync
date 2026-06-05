import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getPerformanceSummary(tenantId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000)

  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: {
      marketplace: true,
      status: true,
      createdAt: true,
      paidAt: true,
      shippedAt: true,
      deliveredAt: true,
      total: true,
    },
  })

  const byMarketplace: Record<string, {
    total: number; delivered: number; cancelled: number; shipped: number
    revenue: number; shippingTimes: number[]; deliveryTimes: number[]
  }> = {}

  let totalOrders = 0
  let totalDelivered = 0
  let totalCancelled = 0
  let totalRevenue = 0
  let shippingTimes: number[] = []
  let deliveryTimes: number[] = []

  for (const o of orders) {
    const mp = o.marketplace
    if (!byMarketplace[mp]) {
      byMarketplace[mp] = { total: 0, delivered: 0, cancelled: 0, shipped: 0, revenue: 0, shippingTimes: [], deliveryTimes: [] }
    }

    totalOrders++
    byMarketplace[mp].total++
    totalRevenue += Number(o.total)
    byMarketplace[mp].revenue += Number(o.total)

    if (o.status === 'DELIVERED') {
      totalDelivered++
      byMarketplace[mp].delivered++
    }
    if (o.status === 'CANCELLED') {
      totalCancelled++
      byMarketplace[mp].cancelled++
    }
    if (o.status === 'SHIPPED' || o.status === 'DELIVERED') {
      byMarketplace[mp].shipped++
    }

    // shipping SLA (paid → shipped)
    if (o.paidAt && o.shippedAt) {
      const hours = (o.shippedAt.getTime() - o.paidAt.getTime()) / 3_600_000
      shippingTimes.push(hours)
      byMarketplace[mp].shippingTimes.push(hours)
    }

    // delivery time (shipped → delivered)
    if (o.shippedAt && o.deliveredAt) {
      const days = (o.deliveredAt.getTime() - o.shippedAt.getTime()) / 86_400_000
      deliveryTimes.push(days)
      byMarketplace[mp].deliveryTimes.push(days)
    }
  }

  function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null }

  const cancellationRate = totalOrders > 0 ? (totalCancelled / totalOrders) * 100 : 0
  const deliveryRate = totalOrders > 0 ? (totalDelivered / totalOrders) * 100 : 0

  const mpSummary = Object.entries(byMarketplace).map(([mp, d]) => ({
    marketplace: mp,
    total: d.total,
    delivered: d.delivered,
    cancelled: d.cancelled,
    revenue: d.revenue,
    cancellationRate: d.total > 0 ? Number(((d.cancelled / d.total) * 100).toFixed(1)) : 0,
    deliveryRate: d.total > 0 ? Number(((d.delivered / d.total) * 100).toFixed(1)) : 0,
    avgShippingHours: avg(d.shippingTimes) != null ? Number(avg(d.shippingTimes)!.toFixed(1)) : null,
    avgDeliveryDays: avg(d.deliveryTimes) != null ? Number(avg(d.deliveryTimes)!.toFixed(1)) : null,
  })).sort((a, b) => b.revenue - a.revenue)

  return {
    totalOrders,
    totalDelivered,
    totalCancelled,
    totalRevenue,
    cancellationRate: Number(cancellationRate.toFixed(1)),
    deliveryRate: Number(deliveryRate.toFixed(1)),
    avgShippingHours: avg(shippingTimes) != null ? Number(avg(shippingTimes)!.toFixed(1)) : null,
    avgDeliveryDays: avg(deliveryTimes) != null ? Number(avg(deliveryTimes)!.toFixed(1)) : null,
    byMarketplace: mpSummary,
  }
}

export async function getDailyPerformance(tenantId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000)

  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { status: true, createdAt: true, total: true },
    orderBy: { createdAt: 'asc' },
  })

  const byDay: Record<string, { date: string; orders: number; delivered: number; cancelled: number }> = {}

  for (const o of orders) {
    const date = o.createdAt.toISOString().slice(0, 10)
    if (!byDay[date]) byDay[date] = { date, orders: 0, delivered: 0, cancelled: 0 }
    byDay[date].orders++
    if (o.status === 'DELIVERED') byDay[date].delivered++
    if (o.status === 'CANCELLED') byDay[date].cancelled++
  }

  return Object.values(byDay)
}
