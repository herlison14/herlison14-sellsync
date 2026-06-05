'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersToday, lowStock, stores, recentOrders] = await Promise.all([
        api.get('/orders', { params: { from: new Date().toISOString().slice(0, 10), limit: 1 } }),
        api.get('/inventory/alerts/low-stock'),
        api.get('/integrations/stores'),
        api.get('/orders', { params: { limit: 7, status: 'PENDING' } }),
      ])
      return {
        ordersToday: ordersToday.data.meta.total,
        lowStockCount: lowStock.data.length,
        connectedStores: stores.data.filter((s: { isActive: boolean }) => s.isActive).length,
        pendingOrders: recentOrders.data.meta.total,
      }
    },
  })

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pedidos Hoje"         value={String(stats?.ordersToday ?? '—')}     color="text-blue-700" />
        <StatCard label="Aguardando Ação"       value={String(stats?.pendingOrders ?? '—')}   color="text-yellow-700" />
        <StatCard label="Alertas de Estoque"    value={String(stats?.lowStockCount ?? '—')}   color="text-red-700" sub="produtos com estoque baixo" />
        <StatCard label="Canais Conectados"     value={String(stats?.connectedStores ?? '—')} color="text-green-700" />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Vendas por Canal (últimos 7 dias)</h2>
        <div className="h-48 text-gray-400 flex items-center justify-center text-sm">
          Conecte seus canais para ver as métricas de vendas
        </div>
      </div>
    </div>
  )
}
