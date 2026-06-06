'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Warehouse, Package,
  Plug, DollarSign, BarChart3, Settings, ChevronRight,
  Zap, Banknote, PackageX, Activity, RefreshCw, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/orders',       label: 'Pedidos',      icon: ShoppingCart },
  { href: '/dashboard/inventory',    label: 'Estoque',      icon: Warehouse },
  { href: '/dashboard/products',     label: 'Produtos',     icon: Package },
  { href: '/dashboard/integrations', label: 'Integrações',  icon: Plug },
  { href: '/dashboard/pricing',      label: 'Precificação', icon: DollarSign },
  { href: '/dashboard/repricing',    label: 'Reprecificação',icon: RefreshCw },
  { href: '/dashboard/catalog',      label: 'Catálogo',      icon: Layers },
  { href: '/dashboard/financial',    label: 'Financeiro',   icon: Banknote },
  { href: '/dashboard/returns',      label: 'Devoluções',   icon: PackageX },
  { href: '/dashboard/performance',  label: 'Performance',  icon: Activity },
  { href: '/dashboard/reports',      label: 'Relatórios',   icon: BarChart3 },
  { href: '/dashboard/settings',     label: 'Configurações',icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground">SellSync</p>
          <p className="text-[10px] text-muted-foreground leading-none">Hub Multichannel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon
                  className={cn('h-4 w-4 shrink-0 transition-transform duration-150', !active && 'group-hover:scale-110')}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-70" />}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Plan badge */}
      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-primary">Plano FREE</span>
            <span className="text-[10px] font-medium text-muted-foreground">0/5 canais</span>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            Fazer upgrade <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
