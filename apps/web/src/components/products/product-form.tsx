'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { Product } from '@/hooks/use-products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  initial?: Partial<Product>
  onSubmit: (data: Partial<Product>) => Promise<unknown>
  title: string
}

export function ProductForm({ initial = {}, onSubmit, title }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    sku: initial.sku ?? '',
    name: initial.name ?? '',
    description: initial.description ?? '',
    brand: initial.brand ?? '',
    ncm: initial.ncm ?? '',
    gtin: initial.gtin ?? '',
    weight: initial.weight ?? '',
    height: initial.height ?? '',
    width: initial.width ?? '',
    length: initial.length ?? '',
    images: (initial.images ?? []).join('\n'),
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sku.trim() || !form.name.trim()) return setError('SKU e Nome são obrigatórios')
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description || undefined,
        brand: form.brand || undefined,
        ncm: form.ncm.replace(/\D/g, '') || undefined,
        gtin: form.gtin || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        width: form.width ? Number(form.width) : undefined,
        length: form.length ? Number(form.length) : undefined,
        images: form.images.split('\n').map((u) => u.trim()).filter(Boolean),
      })
      router.push('/dashboard/products')
    } catch {
      setError('Erro ao salvar produto. Verifique os dados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">SKU *</label>
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="PROD-001" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">GTIN / EAN</label>
              <Input value={form.gtin} onChange={(e) => set('gtin', e.target.value)} placeholder="7891234567890" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome do Produto *</label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome que aparecerá nos anúncios" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Descrição detalhada do produto..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Classificação Fiscal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Marca</label>
              <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Ex: Samsung" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">NCM (8 dígitos)</label>
              <Input value={form.ncm} onChange={(e) => set('ncm', e.target.value)} placeholder="00000000" maxLength={8} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Dimensões e Peso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { field: 'weight' as const, label: 'Peso (kg)' },
              { field: 'height' as const, label: 'Altura (cm)' },
              { field: 'width' as const, label: 'Largura (cm)' },
              { field: 'length' as const, label: 'Comprimento (cm)' },
            ].map(({ field, label }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-sm font-medium">{label}</label>
                <Input type="number" step="0.01" value={form[field] as string} onChange={(e) => set(field, e.target.value)} placeholder="0.00" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Imagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">URLs das imagens <span className="text-muted-foreground font-normal">(uma por linha)</span></label>
            <textarea
              value={form.images}
              onChange={(e) => set('images', e.target.value)}
              rows={4}
              placeholder={'https://exemplo.com/imagem1.jpg\nhttps://exemplo.com/imagem2.jpg'}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          {form.images.split('\n').filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.split('\n').filter(Boolean).map((url, i) => (
                <img key={i} src={url.trim()} alt="" className="h-16 w-16 rounded-lg object-cover border" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Produto'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
