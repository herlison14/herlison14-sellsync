'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/use-orders'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { BulkActionsBar } from '@/components/orders/bulk-actions-bar'

export default function OrdersPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState({ status: '', marketplace: '', search: '', page: 1 })
  const { data, isLoading } = useOrders(filters)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <span className="text-sm text-gray-500">{data?.meta.total ?? 0} pedidos</span>
      </div>

      <OrdersFilters value={filters} onChange={setFilters} />

      {selected.length > 0 && (
        <BulkActionsBar selectedIds={selected} onClear={() => setSelected([])} />
      )}

      <OrdersTable
        orders={data?.data ?? []}
        isLoading={isLoading}
        selected={selected}
        onSelect={setSelected}
      />
    </div>
  )
}
