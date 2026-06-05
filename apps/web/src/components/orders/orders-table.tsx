'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:       { label: 'Aguardando',   color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED:     { label: 'Confirmado',   color: 'bg-blue-100 text-blue-800' },
  INVOICED:      { label: 'NF Emitida',   color: 'bg-purple-100 text-purple-800' },
  READY_TO_SHIP: { label: 'Pronto p/ Envio', color: 'bg-indigo-100 text-indigo-800' },
  SHIPPED:       { label: 'Enviado',      color: 'bg-cyan-100 text-cyan-800' },
  DELIVERED:     { label: 'Entregue',     color: 'bg-green-100 text-green-800' },
  CANCELLED:     { label: 'Cancelado',    color: 'bg-red-100 text-red-800' },
  RETURNED:      { label: 'Devolvido',    color: 'bg-gray-100 text-gray-800' },
}

interface Order {
  id: string
  externalId: string
  marketplace: string
  store: { name: string; marketplace: string }
  status: string
  buyerName: string
  total: number
  createdAt: string
  nfeStatus?: string
  trackingCode?: string
}

interface Props {
  orders: Order[]
  isLoading: boolean
  selected: string[]
  onSelect: (ids: string[]) => void
}

export function OrdersTable({ orders, isLoading, selected, onSelect }: Props) {
  function toggleAll() {
    onSelect(selected.length === orders.length ? [] : orders.map((o) => o.id))
  }

  function toggle(id: string) {
    onSelect(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0 animate-pulse">
            <div className="h-4 w-4 rounded bg-gray-200" />
            <div className="h-4 flex-1 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="p-3 w-10">
              <input type="checkbox" checked={selected.length === orders.length && orders.length > 0} onChange={toggleAll} />
            </th>
            <th className="p-3 text-left">Pedido</th>
            <th className="p-3 text-left">Canal</th>
            <th className="p-3 text-left">Comprador</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">NF-e</th>
            <th className="p-3 text-right">Total</th>
            <th className="p-3 text-left">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">Nenhum pedido encontrado</td>
            </tr>
          )}
          {orders.map((order) => {
            const status = STATUS_LABEL[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' }
            return (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggle(order.id)} />
                </td>
                <td className="p-3 font-mono text-xs">{order.externalId}</td>
                <td className="p-3">
                  <span className="font-medium">{order.store.marketplace}</span>
                  <span className="block text-xs text-gray-400">{order.store.name}</span>
                </td>
                <td className="p-3">{order.buyerName ?? '—'}</td>
                <td className="p-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </td>
                <td className="p-3 text-xs">
                  {order.nfeStatus === 'AUTHORIZED' && <span className="text-green-600">Autorizada</span>}
                  {order.nfeStatus === 'PENDING' && <span className="text-yellow-600">Pendente</span>}
                  {order.nfeStatus === 'REJECTED' && <span className="text-red-600">Rejeitada</span>}
                  {!order.nfeStatus && <span className="text-gray-400">—</span>}
                </td>
                <td className="p-3 text-right font-medium">
                  {Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {format(new Date(order.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
