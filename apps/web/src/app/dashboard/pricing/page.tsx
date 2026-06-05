'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const TYPE_LABEL: Record<string, string> = {
  MARKUP_PERCENTAGE: 'Markup (%)',
  MARGIN_PERCENTAGE: 'Margem (%)',
  FIXED_ADDITION: 'Adição Fixa (R$)',
  FIXED_PRICE: 'Preço Fixo (R$)',
}

interface Rule {
  id: string
  name: string
  marketplace: string | null
  type: string
  value: string
  isActive: boolean
}

export default function PricingPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [simBase, setSimBase] = useState('')
  const [simMarketplace, setSimMarketplace] = useState('')
  const [simResult, setSimResult] = useState<{ finalPrice: number; margin: string } | null>(null)
  const [form, setForm] = useState({ name: '', marketplace: '', type: 'MARKUP_PERCENTAGE', value: '' })

  const { data: rules } = useQuery<Rule[]>({
    queryKey: ['pricing-rules'],
    queryFn: async () => (await api.get('/pricing/rules')).data,
  })

  const createRule = useMutation({
    mutationFn: async (data: typeof form) => {
      await api.post('/pricing/rules', {
        ...data,
        value: Number(data.value),
        marketplace: data.marketplace || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-rules'] })
      setShowForm(false)
      setForm({ name: '', marketplace: '', type: 'MARKUP_PERCENTAGE', value: '' })
    },
  })

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/pricing/rules/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-rules'] }),
  })

  const deleteRule = useMutation({
    mutationFn: async (id: string) => api.delete(`/pricing/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-rules'] }),
  })

  async function simulate() {
    const { data } = await api.post('/pricing/simulate', {
      basePrice: Number(simBase),
      marketplace: simMarketplace || undefined,
    })
    setSimResult(data)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Precificação</h1>
          <p className="text-sm text-gray-500">Regras aplicadas automaticamente ao publicar anúncios</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Nova Regra
        </button>
      </div>

      {/* Simulador */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-700">Simulador de Preço</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Custo base (R$)</label>
            <input
              type="number" value={simBase} onChange={(e) => setSimBase(e.target.value)}
              className="w-32 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Marketplace (opcional)</label>
            <select
              value={simMarketplace} onChange={(e) => setSimMarketplace(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as regras</option>
              <option value="MERCADO_LIVRE">Mercado Livre</option>
              <option value="SHOPEE">Shopee</option>
              <option value="AMAZON">Amazon</option>
            </select>
          </div>
          <button
            onClick={simulate} disabled={!simBase}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
          >
            Simular
          </button>
          {simResult && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm">
              <span className="font-bold text-green-700">
                {simResult.finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-green-600 ml-2">(margem: {simResult.margin}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Nova Regra</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Markup Shopee 20%" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Valor</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Marketplace (deixe vazio para todos)</label>
              <select value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos os canais</option>
                <option value="MERCADO_LIVRE">Mercado Livre</option>
                <option value="SHOPEE">Shopee</option>
                <option value="AMAZON">Amazon</option>
                <option value="MAGALU">Magalu</option>
                <option value="AMERICANAS">Americanas</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={() => createRule.mutate(form)}
              disabled={!form.name || !form.value || createRule.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createRule.isPending ? 'Salvando...' : 'Salvar Regra'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de regras */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3 text-left">Canal</th>
              <th className="p-3 text-center">Ativo</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rules ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma regra criada</td></tr>
            )}
            {(rules ?? []).map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{rule.name}</td>
                <td className="p-3 text-gray-600">{TYPE_LABEL[rule.type]}</td>
                <td className="p-3 text-right font-mono">{Number(rule.value).toFixed(2)}</td>
                <td className="p-3 text-gray-500">{rule.marketplace ?? 'Todos'}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleRule.mutate({ id: rule.id, isActive: !rule.isActive })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${rule.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => deleteRule.mutate(rule.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
