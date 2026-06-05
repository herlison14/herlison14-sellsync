'use client'

interface Filters {
  status: string
  marketplace: string
  search: string
  page: number
}

const STATUSES = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: 'Aguardando' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'INVOICED', label: 'NF Emitida' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const MARKETPLACES = [
  { value: '', label: 'Todos os canais' },
  { value: 'MERCADO_LIVRE', label: 'Mercado Livre' },
  { value: 'SHOPEE', label: 'Shopee' },
  { value: 'AMAZON', label: 'Amazon' },
  { value: 'MAGALU', label: 'Magalu' },
]

export function OrdersFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Buscar por pedido, comprador..."
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="flex-1 min-w-48 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value, page: 1 })}
        className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select
        value={value.marketplace}
        onChange={(e) => onChange({ ...value, marketplace: e.target.value, page: 1 })}
        className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {MARKETPLACES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  )
}
