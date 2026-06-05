'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, Plug, DollarSign, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function StatCard({ title, value, sub, icon: Icon, trend, colorClass, loading }: {
  title: string; value: string; sub: string; icon: React.ElementType
  trend?: number; colorClass: string; loading?: boolean
}) {
  if (loading) return <Skeleton className="h-32 rounded-xl" />
  return (
    <Card className="animate-fade-in hover:shadow-card-hover transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClass)}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3">
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
            <span className={cn('text-xs font-bold', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-xs text-muted-foreground">vs. mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [lowStock, stores, orders] = await Promise.all([
        api.get('/inventory/alerts/low-stock'),
        api.get('/integrations/stores'),
        api.get('/orders', { params: { limit: 1, status: 'PENDING' } }),
      ])
      return {
        lowStockCount: lowStock.data.length,
        connectedStores: stores.data.filter((s: { isActive: boolean }) => s.isActive).length,
        pendingOrders: orders.data.meta?.total ?? 0,
        revenue: 0,
        revenueGrowth: 0,
      }
    },
  })

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu negócio</p>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Receita do mês" value={fmt(stats?.revenue ?? 0)} sub="Total em vendas confirmadas" icon={DollarSign} trend={stats?.revenueGrowth} loading={isLoading} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Pedidos pendentes" value={String(stats?.pendingOrders ?? 0)} sub="Aguardando processamento" icon={ShoppingCart} loading={isLoading} colorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Estoque crítico" value={String(stats?.lowStockCount ?? 0)} sub="Produtos abaixo do mínimo" icon={AlertTriangle} loading={isLoading} colorClass="bg-red-50 text-red-500" />
        <StatCard title="Canais ativos" value={String(stats?.connectedStores ?? 0)} sub="Marketplaces conectados" icon={Plug} loading={isLoading} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: '/dashboard/orders', label: 'Pedidos pendentes', desc: 'Processar e despachar', color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-800' },
          { href: '/dashboard/inventory', label: 'Estoque baixo', desc: 'Repor produtos críticos', color: 'border-red-200 bg-red-50/60 hover:bg-red-100/80 text-red-800' },
          { href: '/dashboard/integrations', label: 'Novos marketplaces', desc: 'Expandir seu alcance', color: 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800' },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} className={cn('group rounded-xl border p-4 transition-all duration-150 hover:shadow-card', color)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs mt-0.5 opacity-70">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
