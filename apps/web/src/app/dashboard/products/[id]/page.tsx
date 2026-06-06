'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Megaphone } from 'lucide-react'
import { useProduct, useUpdateProduct, usePublishProduct } from '@/hooks/use-products'
import { useStores } from '@/hooks/use-stores'
import { ProductForm } from '@/components/products/product-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { MP_EMOJI } from '@/lib/marketplace'



export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading } = useProduct(id)
  const { data: stores } = useStores()
  const update = useUpdateProduct(id)
  const publish = usePublishProduct(id)
  const [publishForm, setPublishForm] = useState({ storeId: '', price: '', title: '' })
  const [publishing, setPublishing] = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  if (isLoading || !product) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

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

      <div className="px-6 pb-6 max-w-2xl">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Anúncios Ativos
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowPublish((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Publicar em Canal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Estoque disponível: <span className="font-semibold text-foreground">{totalStock} un.</span>
            </p>

            {product.listings.length === 0 && (
              <p className="text-sm text-muted-foreground/60 py-2">Nenhum anúncio publicado ainda.</p>
            )}

            <div className="space-y-2">
              {product.listings.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-muted/30 border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span>{MP_EMOJI[l.store.marketplace] ?? '🏪'}</span>
                    <span className="text-sm font-medium">{l.store.marketplace.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-600">
                      {Number(l.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <Badge variant={l.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-xs">
                      {l.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {showPublish && (
              <form onSubmit={handlePublish} className="border-t pt-4 space-y-3 animate-fade-in">
                <p className="text-sm font-semibold">Novo Anúncio</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Canal</label>
                  <select
                    value={publishForm.storeId}
                    onChange={(e) => setPublishForm((f) => ({ ...f, storeId: e.target.value }))}
                    required
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Selecionar canal...</option>
                    {activeStores.map((s) => (
                      <option key={s.id} value={s.id}>{MP_EMOJI[s.marketplace] ?? '🏪'} {s.name} ({s.marketplace})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Preço de venda (R$)</label>
                    <Input type="number" step="0.01" value={publishForm.price}
                      onChange={(e) => setPublishForm((f) => ({ ...f, price: e.target.value }))}
                      required placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Título <span className="text-muted-foreground/60">(opcional)</span></label>
                    <Input value={publishForm.title}
                      onChange={(e) => setPublishForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder={product.name} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={publishing}>
                    {publishing ? 'Publicando...' : 'Publicar Agora'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowPublish(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
