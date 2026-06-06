'use client'

import { useInventory } from '@/hooks/use-inventory'
import { StockTable } from '@/components/inventory/stock-table'
import { LowStockAlert } from '@/components/inventory/low-stock-alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function InventoryPage() {
  const { data: stock, isLoading } = useInventory()
  const lowStock = stock?.filter((s: any) => s.quantity - s.reserved <= s.minAlert) ?? []

  return (
    <div className="flex flex-col gap-5 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle de estoque em tempo real</p>
        </div>
        {lowStock.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {lowStock.length} produto{lowStock.length > 1 ? 's' : ''} crítico{lowStock.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {lowStock.length > 0 && <LowStockAlert items={lowStock} />}

      {isLoading
        ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        : <StockTable items={stock ?? []} isLoading={isLoading} />
      }
    </div>
  )
}
