'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/use-orders'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { BulkActionsBar } from '@/components/orders/bulk-actions-bar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState({ status: '', marketplace: '', search: '', page: 1 })
  const { data, isLoading } = useOrders(filters)

  return (
    <div className="flex flex-col gap-5 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie e processe seus pedidos</p>
        </div>
        {!isLoading && (
          <Badge variant="secondary" className="text-xs font-medium">
            {data?.meta.total ?? 0} pedidos
          </Badge>
        )}
      </div>

      <OrdersFilters value={filters} onChange={setFilters} />

      {selected.length > 0 && (
        <BulkActionsBar selectedIds={selected} onClear={() => setSelected([])} />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : (
        <OrdersTable orders={data?.data ?? []} isLoading={isLoading} selected={selected} onSelect={setSelected} />
      )}
    </div>
  )
}
