'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Warehouse, Package,
  Plug, DollarSign, BarChart3, Settings,
  Zap, Banknote, PackageX, Activity, RefreshCw, Layers, Truck, Megaphone, Shield, Users,
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
  { href: '/dashboard/listings',     label: 'Anúncios',      icon: Megaphone },
  { href: '/dashboard/catalog',      label: 'Catálogo',      icon: Layers },
  { href: '/dashboard/suppliers',    label: 'Fornecedores',  icon: Truck },
  { href: '/dashboard/financial',    label: 'Financeiro',   icon: Banknote },
  { href: '/dashboard/returns',      label: 'Devoluções',   icon: PackageX },
  { href: '/dashboard/performance',  label: 'Performance',  icon: Activity },
  { href: '/dashboard/reports',      label: 'Relatórios',   icon: BarChart3 },
  { href: '/dashboard/customers',    label: 'Clientes',      icon: Users },
  { href: '/dashboard/audit',        label: 'Auditoria',    icon: Shield },
  { href: '/dashboard/settings',     label: 'Configurações',icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent shadow-glow">
          <Zap className="h-4 w-4 text-sidebar-accent-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">SellSync</p>
          <p className="text-[10px] text-sidebar-muted-foreground leading-none">Hub Multichannel</p>
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
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-sidebar-hover text-sidebar-foreground'
                    : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground'
                )}
              >
                {/* Indicador de item ativo — barra fina, não preenche o
                    item inteiro de cor sólida (mantém a régua legível
                    mesmo com 17 itens). */}
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-accent transition-opacity',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Icon
                  className={cn('h-4 w-4 shrink-0 transition-transform duration-150', active ? 'text-sidebar-accent' : 'group-hover:scale-110')}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Plan badge */}
      <div className="border-t border-sidebar-border p-3">
        <div className="bg-glow rounded-lg border border-sidebar-border bg-sidebar-hover p-3" style={{ '--glow-x': '90%', '--glow-y': '0%' } as React.CSSProperties}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-sidebar-foreground">Plano FREE</span>
            <span className="text-[10px] font-medium text-sidebar-muted-foreground">0/5 canais</span>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1 text-xs font-medium text-sidebar-accent hover:brightness-125"
          >
            Fazer upgrade →
          </Link>
        </div>
      </div>
    </aside>
  )
}
