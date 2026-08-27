'use client'

import { MARKETPLACES, MP_LABEL } from '@/lib/marketplace'

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
  { value: 'READY_TO_SHIP', label: 'Pronto p/ envio' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'RETURNED', label: 'Devolvido' },
]

// Deriva dos canais de verdade cadastrados no enum Marketplace (lib/marketplace.ts)
// em vez de uma lista fixa — evita esquecer de listar um canal novo aqui
// (aconteceu com LOJA_DESCARTAVEIS: o filtro não sabia dele e escondia
// os pedidos da loja própria mesmo com "Todos os canais" selecionado).
const CHANNELS = [{ value: '', label: 'Todos os canais' }, ...MARKETPLACES.map((m) => ({ value: m, label: MP_LABEL[m] }))]

export function OrdersFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Buscar por pedido, comprador..."
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="flex-1 min-w-48 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value, page: 1 })}
        className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select
        value={value.marketplace}
        onChange={(e) => onChange({ ...value, marketplace: e.target.value, page: 1 })}
        className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {CHANNELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  )
}
