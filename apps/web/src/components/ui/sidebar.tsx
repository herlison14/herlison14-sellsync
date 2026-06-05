'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',              label: 'Dashboard',    icon: '📊' },
  { href: '/dashboard/orders',       label: 'Pedidos',      icon: '📦' },
  { href: '/dashboard/inventory',    label: 'Estoque',      icon: '🏭' },
  { href: '/dashboard/products',     label: 'Produtos',     icon: '🗂️' },
  { href: '/dashboard/integrations', label: 'Integrações',  icon: '🔗' },
  { href: '/dashboard/settings',     label: 'Configurações',icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 flex-shrink-0 border-r bg-white flex flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">S</div>
        <span className="font-bold text-gray-800">SellSync</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-4">
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          <p className="font-medium text-gray-700">Plano FREE</p>
          <p>Upgrade para mais recursos</p>
        </div>
      </div>
    </aside>
  )
}
