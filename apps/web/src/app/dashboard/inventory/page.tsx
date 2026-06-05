'use client'

import { useInventory } from '@/hooks/use-inventory'
import { StockTable } from '@/components/inventory/stock-table'
import { LowStockAlert } from '@/components/inventory/low-stock-alert'

export default function InventoryPage() {
  const { data: stock, isLoading } = useInventory()
  const lowStock = stock?.filter((s) => s.quantity - s.reserved <= s.minAlert) ?? []

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Estoque</h1>

      {lowStock.length > 0 && <LowStockAlert items={lowStock} />}

      <StockTable items={stock ?? []} isLoading={isLoading} />
    </div>
  )
}
