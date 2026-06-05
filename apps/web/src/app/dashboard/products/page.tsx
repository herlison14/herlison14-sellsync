'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProducts, useDeleteProduct } from '@/hooks/use-products'

const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
  MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫', TIKTOK_SHOP: '▶️',
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useProducts(search)
  const deleteProduct = useDeleteProduct()

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link
          href="/dashboard/products/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Novo Produto
        </Link>
      </div>

      <input
        type="text"
        placeholder="Buscar por nome ou SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data?.data ?? []).map((product) => {
            const totalStock = product.stockItems.reduce((s, i) => s + i.quantity - i.reserved, 0)
            const isLow = totalStock <= 5
            return (
              <div key={product.id} className="group relative rounded-lg border bg-white overflow-hidden hover:shadow-md transition-shadow">
                {/* Imagem */}
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-gray-200">📦</div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <p className="font-semibold text-sm line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-xs font-mono text-gray-400">{product.sku}</p>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-gray-600'}`}>
                      {totalStock} un. em estoque
                    </span>
                    <div className="flex gap-0.5">
                      {product.listings.map((l) => (
                        <span key={l.id} title={l.store.marketplace} className="text-sm">
                          {MP_EMOJI[l.store.marketplace] ?? '🏪'}
                        </span>
                      ))}
                      {product.listings.length === 0 && (
                        <span className="text-xs text-gray-300">sem anúncios</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="flex-1 rounded-md bg-blue-50 py-1.5 text-center text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => { if (confirm('Excluir produto?')) deleteProduct.mutate(product.id) }}
                      className="rounded-md border px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {(data?.data ?? []).length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-medium">Nenhum produto cadastrado</p>
              <Link href="/dashboard/products/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Criar primeiro produto →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
