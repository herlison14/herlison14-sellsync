'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/hooks/use-products'

interface Props {
  initial?: Partial<Product>
  onSubmit: (data: Partial<Product>) => Promise<unknown>
  title: string
}

const SECTION = 'rounded-lg border bg-white p-5 space-y-4'
const INPUT = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'

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
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Voltar</button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className={SECTION}>
        <h2 className="font-semibold text-gray-700">Identificação</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>SKU *</label>
            <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={INPUT} placeholder="PROD-001" required />
          </div>
          <div>
            <label className={LABEL}>GTIN / EAN / Código de barras</label>
            <input value={form.gtin} onChange={(e) => set('gtin', e.target.value)} className={INPUT} placeholder="7891234567890" />
          </div>
        </div>
        <div>
          <label className={LABEL}>Nome do Produto *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} placeholder="Nome que aparecerá nos anúncios" required />
        </div>
        <div>
          <label className={LABEL}>Descrição</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={INPUT} rows={4} placeholder="Descrição detalhada do produto..." />
        </div>
      </div>

      <div className={SECTION}>
        <h2 className="font-semibold text-gray-700">Classificação Fiscal</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Marca</label>
            <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={INPUT} placeholder="Ex: Samsung" />
          </div>
          <div>
            <label className={LABEL}>NCM (8 dígitos)</label>
            <input value={form.ncm} onChange={(e) => set('ncm', e.target.value)} className={INPUT} placeholder="00000000" maxLength={8} />
          </div>
        </div>
      </div>

      <div className={SECTION}>
        <h2 className="font-semibold text-gray-700">Dimensões e Peso</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { field: 'weight' as const, label: 'Peso (kg)' },
            { field: 'height' as const, label: 'Altura (cm)' },
            { field: 'width' as const, label: 'Largura (cm)' },
            { field: 'length' as const, label: 'Comprimento (cm)' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className={LABEL}>{label}</label>
              <input type="number" step="0.01" value={form[field]} onChange={(e) => set(field, e.target.value)} className={INPUT} placeholder="0.00" />
            </div>
          ))}
        </div>
      </div>

      <div className={SECTION}>
        <h2 className="font-semibold text-gray-700">Imagens</h2>
        <div>
          <label className={LABEL}>URLs das imagens (uma por linha)</label>
          <textarea
            value={form.images}
            onChange={(e) => set('images', e.target.value)}
            className={INPUT}
            rows={4}
            placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
          />
        </div>
        {form.images.split('\n').filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.images.split('\n').filter(Boolean).map((url, i) => (
              <img key={i} src={url.trim()} alt="" className="h-16 w-16 rounded-lg object-cover border" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar Produto'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border px-6 py-2.5 text-sm hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}
