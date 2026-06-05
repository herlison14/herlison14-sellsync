'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useProduct, useUpdateProduct, usePublishProduct } from '@/hooks/use-products'
import { useStores } from '@/hooks/use-stores'
import { ProductForm } from '@/components/products/product-form'

const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
  MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫', TIKTOK_SHOP: '▶️',
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading } = useProduct(id)
  const { data: stores } = useStores()
  const update = useUpdateProduct(id)
  const publish = usePublishProduct(id)
  const [publishForm, setPublishForm] = useState({ storeId: '', price: '', title: '' })
  const [publishing, setPublishing] = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  if (isLoading || !product) return <div className="p-6 text-gray-400 animate-pulse">Carregando produto...</div>

  const activeStores = (stores ?? []).filter((s) => s.isActive)
  const totalStock = product.stockItems.reduce((s, i) => s + i.quantity - i.reserved, 0)

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    setPublishing(true)
    try {
      await publish.mutateAsync({ storeId: publishForm.storeId, price: Number(publishForm.price), title: publishForm.title || undefined })
      setShowPublish(false)
      setPublishForm({ storeId: '', price: '', title: '' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4">
      <ProductForm title={`Editar: ${product.name}`} initial={product} onSubmit={(data) => update.mutateAsync(data)} />

      {/* Painel de Publicação */}
      <div className="mx-6 mb-6 max-w-2xl rounded-lg border bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Anúncios Ativos</h2>
          <button
            onClick={() => setShowPublish((v) => !v)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Publicar em Canal
          </button>
        </div>

        <p className="text-sm text-gray-500">Estoque total disponível: <strong>{totalStock} un.</strong></p>

        {product.listings.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum anúncio publicado ainda.</p>
        )}

        <div className="space-y-2">
          {product.listings.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span>{MP_EMOJI[l.store.marketplace] ?? '🏪'}</span>
                <span className="font-medium">{l.store.marketplace.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-green-700">
                  {Number(l.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  l.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{l.status}</span>
              </div>
            </div>
          ))}
        </div>

        {showPublish && (
          <form onSubmit={handlePublish} className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Novo Anúncio</h3>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Canal</label>
              <select
                value={publishForm.storeId}
                onChange={(e) => setPublishForm((f) => ({ ...f, storeId: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar canal...</option>
                {activeStores.map((s) => (
                  <option key={s.id} value={s.id}>{MP_EMOJI[s.marketplace] ?? '🏪'} {s.name} ({s.marketplace})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Preço de venda (R$)</label>
                <input
                  type="number" step="0.01" value={publishForm.price}
                  onChange={(e) => setPublishForm((f) => ({ ...f, price: e.target.value }))}
                  required className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Título (opcional)</label>
                <input
                  value={publishForm.title}
                  onChange={(e) => setPublishForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={product.name}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={publishing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {publishing ? 'Publicando...' : 'Publicar Agora'}
              </button>
              <button type="button" onClick={() => setShowPublish(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
