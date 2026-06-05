'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useSearchParams } from 'next/navigation'

const TABS = ['Empresa', 'Fiscal (NF-e)', 'Armazéns', 'Equipe', 'Plano'] as const
type Tab = typeof TABS[number]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Empresa')
  const params = useSearchParams()
  const upgradeStatus = params.get('upgrade')

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {upgradeStatus === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Plano atualizado com sucesso! Obrigado.
        </div>
      )}

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Empresa' && <CompanyTab />}
      {tab === 'Fiscal (NF-e)' && <NfeTab />}
      {tab === 'Armazéns' && <WarehousesTab />}
      {tab === 'Equipe' && <TeamTab />}
      {tab === 'Plano' && <PlanTab />}
    </div>
  )
}

function CompanyTab() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data })

  return (
    <div className="max-w-lg space-y-4 rounded-lg border bg-white p-6">
      <h2 className="font-semibold">Dados da Empresa</h2>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nome da empresa</label>
        <input defaultValue={me?.tenant?.name} className="w-full rounded-lg border px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Plano atual</label>
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
          {me?.tenant?.plan ?? 'FREE'}
        </span>
      </div>
    </div>
  )
}

function NfeTab() {
  const qc = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['nfe-settings'],
    queryFn: async () => (await api.get('/nfe/settings')).data,
  })
  const [form, setForm] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: async () => api.put('/nfe/settings', { ...settings, ...form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nfe-settings'] }),
  })

  const value = (field: string, fallback = '') => form[field] ?? settings?.[field] ?? fallback

  return (
    <div className="max-w-lg space-y-4 rounded-lg border bg-white p-6">
      <h2 className="font-semibold">Configurações Fiscais (NF-e)</h2>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        Configure os dados da sua empresa para emissão de notas fiscais. Em homologação os dados são enviados ao SEFAZ mas não têm validade legal.
      </div>

      {[
        { field: 'cnpj', label: 'CNPJ (somente números)', placeholder: '00000000000100' },
        { field: 'razaoSocial', label: 'Razão Social', placeholder: 'Empresa LTDA' },
        { field: 'ie', label: 'Inscrição Estadual', placeholder: 'ISENTO ou número' },
        { field: 'uf', label: 'UF', placeholder: 'SP' },
      ].map(({ field, label, placeholder }) => (
        <div key={field}>
          <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
          <input
            value={value(field)}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
          />
        </div>
      ))}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">CRT — Código Regime Tributário</label>
        <select
          value={value('crt', '1')}
          onChange={(e) => setForm((f) => ({ ...f, crt: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1">1 — Simples Nacional</option>
          <option value="2">2 — Simples Nacional (excesso de sublimite)</option>
          <option value="3">3 — Regime Normal</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Ambiente</label>
        <select
          value={value('environment', 'homologacao')}
          onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="homologacao">Homologação (testes)</option>
          <option value="producao">Produção (real)</option>
        </select>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {save.isPending ? 'Salvando...' : 'Salvar Configurações Fiscais'}
      </button>
    </div>
  )
}

function WarehousesTab() {
  const qc = useQueryClient()
  const [name, setName] = useState('')

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data,
  })

  const create = useMutation({
    mutationFn: async () => api.post('/inventory/warehouses', { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setName('') },
  })

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-lg border bg-white p-5 space-y-3">
        <h2 className="font-semibold">Novo Armazém</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Galpão Principal"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => create.mutate()}
            disabled={!name || create.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        {(warehouses ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-gray-400">Nenhum armazém cadastrado</p>
        )}
        {(warehouses ?? []).map((w: { id: string; name: string; isDefault: boolean }) => (
          <div key={w.id} className="flex items-center justify-between p-4 border-b last:border-0">
            <div>
              <span className="font-medium">{w.name}</span>
              {w.isDefault && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Padrão</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamTab() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data })

  return (
    <div className="max-w-lg rounded-lg border bg-white p-6 space-y-4">
      <h2 className="font-semibold">Equipe</h2>
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {me?.name?.[0] ?? '?'}
        </div>
        <div>
          <p className="font-medium">{me?.name}</p>
          <p className="text-sm text-gray-500">{me?.email} · {me?.role}</p>
        </div>
        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Dono</span>
      </div>
      <p className="text-sm text-gray-400">Convite de membros disponível no plano Starter e acima.</p>
    </div>
  )
}

function PlanTab() {
  const { data: currentPlan } = useQuery({
    queryKey: ['current-plan'],
    queryFn: async () => (await api.get('/billing/plan')).data,
  })
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/billing/plans')).data,
  })

  const checkout = useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await api.post('/billing/checkout', { plan })
      window.location.href = data.url
    },
  })

  const portal = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/billing/portal')
      window.location.href = data.url
    },
  })

  const PRICE: Record<string, string> = { FREE: 'Grátis', STARTER: 'R$ 79/mês', GROWTH: 'R$ 199/mês', PRO: 'R$ 399/mês' }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        Plano atual: <strong>{currentPlan?.name ?? 'Free'}</strong>
        {currentPlan?.key !== 'FREE' && (
          <button onClick={() => portal.mutate()} className="ml-3 underline">Gerenciar assinatura</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(plans ?? []).filter((p: { key: string }) => p.key !== 'FREE').map((plan: { key: string; name: string; limits: Record<string, number> }) => (
          <div
            key={plan.key}
            className={`rounded-lg border bg-white p-5 space-y-3 ${currentPlan?.key === plan.key ? 'border-blue-400 ring-2 ring-blue-100' : ''}`}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{plan.name}</h3>
              {currentPlan?.key === plan.key && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Atual</span>
              )}
            </div>
            <p className="text-2xl font-bold text-blue-700">{PRICE[plan.key]}</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✓ {plan.limits.orders === -1 ? 'Pedidos ilimitados' : `${plan.limits.orders.toLocaleString()} pedidos/mês`}</li>
              <li>✓ {plan.limits.stores === -1 ? 'Canais ilimitados' : `${plan.limits.stores} canais`}</li>
              <li>✓ {plan.limits.users === -1 ? 'Usuários ilimitados' : `${plan.limits.users} usuários`}</li>
            </ul>
            {currentPlan?.key !== plan.key && (
              <button
                onClick={() => checkout.mutate(plan.key)}
                disabled={checkout.isPending}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Assinar {plan.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
