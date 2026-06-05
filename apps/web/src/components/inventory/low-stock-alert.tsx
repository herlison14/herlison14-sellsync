'use client'

interface LowStockItem {
  product: { name: string; sku: string }
  warehouse: { name: string }
  quantity: number
  reserved: number
}

export function LowStockAlert({ items }: { items: LowStockItem[] }) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <h3 className="font-semibold text-yellow-800 mb-2">
        Alerta de estoque baixo — {items.length} {items.length === 1 ? 'produto' : 'produtos'}
      </h3>
      <div className="space-y-1">
        {items.slice(0, 5).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm text-yellow-700">
            <span>{item.product.name} <span className="text-xs opacity-70">({item.product.sku})</span></span>
            <span className={`font-bold ${item.quantity === 0 ? 'text-red-600' : ''}`}>
              {item.quantity - item.reserved} un. em {item.warehouse.name}
            </span>
          </div>
        ))}
        {items.length > 5 && <p className="text-xs text-yellow-600">+{items.length - 5} outros produtos com estoque baixo</p>}
      </div>
    </div>
  )
}
