'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PERIODS = [
  { label: '7 dias',  value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
]

function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ReportsPage() {
  const [days, setDays] = useState(30)

  const { data: overview } = useQuery({
    queryKey: ['reports-overview', days],
    queryFn: async () => (await api.get('/reports/overview', { params: { days } })).data,
  })

  const { data: dailySales } = useQuery({
    queryKey: ['reports-daily', days],
    queryFn: async () => (await api.get('/reports/daily-sales', { params: { days } })).data,
  })

  const { data: topProducts } = useQuery({
    queryKey: ['reports-top-products', days],
    queryFn: async () => (await api.get('/reports/top-products', { params: { days } })).data,
  })

  const { data: nfe } = useQuery({
    queryKey: ['reports-nfe', days],
    queryFn: async () => (await api.get('/reports/nfe-summary', { params: { days } })).data,
  })

  const byMarketplace = overview?.byMarketplace
    ? Object.entries(overview.byMarketplace).map(([mp, d]: [string, unknown]) => ({
        name: mp.replace('_', ' '),
        ...d as { orders: number; revenue: number },
      }))
    : []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === p.value ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Receita Total',     value: currency(overview?.totalRevenue ?? 0),        color: 'text-blue-700' },
          { label: 'Pedidos',           value: String(overview?.totalOrders ?? 0),            color: 'text-gray-900' },
          { label: 'Ticket Médio',      value: currency(overview?.averageTicket ?? 0),        color: 'text-green-700' },
          { label: 'Cancelamentos',     value: String(overview?.totalCancelled ?? 0),         color: 'text-red-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de vendas diárias */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-700">Vendas Diárias</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailySales ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'dd/MM', { locale: ptBR })} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => currency(v)} labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy', { locale: ptBR })} />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} name="Receita" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Receita por marketplace */}
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-700">Receita por Canal</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMarketplace} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: number) => currency(v)} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top produtos */}
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-700">Top 10 Produtos</h2>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {(topProducts ?? []).map((p: { sku: string; name: string; totalQty: number; totalRevenue: number }, i: number) => (
              <div key={p.sku} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-bold text-gray-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.totalQty} un.</p>
                </div>
                <span className="text-sm font-semibold text-green-700">{currency(p.totalRevenue)}</span>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-4">Sem dados no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Status NF-e */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-700">Status NF-e no Período</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Autorizadas', value: nfe?.authorized ?? 0, color: 'text-green-700 bg-green-50' },
            { label: 'Pendentes',   value: nfe?.pending ?? 0,    color: 'text-yellow-700 bg-yellow-50' },
            { label: 'Rejeitadas',  value: nfe?.rejected ?? 0,   color: 'text-red-700 bg-red-50' },
            { label: 'Canceladas',  value: nfe?.cancelled ?? 0,  color: 'text-gray-700 bg-gray-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
