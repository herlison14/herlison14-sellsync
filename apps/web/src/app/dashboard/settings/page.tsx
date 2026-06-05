'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TABS = ['Empresa', 'Fiscal (NF-e)', 'Armazéns', 'Equipe', 'Plano'] as const
type Tab = typeof TABS[number]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Empresa')
  const params = useSearchParams()
  const upgradeStatus = params.get('upgrade')

  return (
    <div className="flex flex-col gap-5 p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {upgradeStatus === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Plano atualizado com sucesso! Obrigado.
        </div>
      )}

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
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
    <Card className="max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Dados da Empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nome da empresa</label>
          <Input defaultValue={me?.tenant?.name} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Plano atual</label>
          <div>
            <Badge variant="info">{me?.tenant?.plan ?? 'FREE'}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
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

  const selectCls = 'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <Card className="max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Configurações Fiscais (NF-e)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          Configure os dados da sua empresa para emissão de notas fiscais. Em homologação os dados são enviados ao SEFAZ mas não têm validade legal.
        </div>

        {[
          { field: 'cnpj', label: 'CNPJ (somente números)', placeholder: '00000000000100' },
          { field: 'razaoSocial', label: 'Razão Social', placeholder: 'Empresa LTDA' },
          { field: 'ie', label: 'Inscrição Estadual', placeholder: 'ISENTO ou número' },
          { field: 'uf', label: 'UF', placeholder: 'SP' },
        ].map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            <Input value={value(field)} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">CRT — Código Regime Tributário</label>
          <select value={value('crt', '1')} onChange={(e) => setForm((f) => ({ ...f, crt: e.target.value }))} className={selectCls}>
            <option value="1">1 — Simples Nacional</option>
            <option value="2">2 — Simples Nacional (excesso de sublimite)</option>
            <option value="3">3 — Regime Normal</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ambiente</label>
          <select value={value('environment', 'homologacao')} onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))} className={selectCls}>
            <option value="homologacao">Homologação (testes)</option>
            <option value="producao">Produção (real)</option>
          </select>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          {save.isPending ? 'Salvando...' : 'Salvar Configurações Fiscais'}
        </Button>
      </CardContent>
    </Card>
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Novo Armazém</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Galpão Principal" className="flex-1" />
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>Criar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {(warehouses ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum armazém cadastrado</p>
        )}
        {(warehouses ?? []).map((w: { id: string; name: string; isDefault: boolean }) => (
          <div key={w.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <span className="font-medium">{w.name}</span>
            {w.isDefault && <Badge variant="info" className="text-xs">Padrão</Badge>}
          </div>
        ))}
      </Card>
    </div>
  )
}

function TeamTab() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data })

  return (
    <Card className="max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Equipe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 border px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {me?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <p className="font-medium">{me?.name}</p>
            <p className="text-sm text-muted-foreground">{me?.email} · {me?.role}</p>
          </div>
          <Badge variant="success" className="text-xs">Dono</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Convite de membros disponível no plano Starter e acima.</p>
      </CardContent>
    </Card>
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
      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <span>Plano atual: <strong>{currentPlan?.name ?? 'Free'}</strong></span>
        {currentPlan?.key !== 'FREE' && (
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => portal.mutate()}>
            Gerenciar assinatura
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(plans ?? []).filter((p: { key: string }) => p.key !== 'FREE').map((plan: { key: string; name: string; limits: Record<string, number> }) => (
          <Card key={plan.key} className={cn(currentPlan?.key === plan.key ? 'border-primary ring-2 ring-primary/20' : '')}>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                {currentPlan?.key === plan.key && <Badge variant="info" className="text-xs">Atual</Badge>}
              </div>
              <p className="text-2xl font-bold text-primary">{PRICE[plan.key]}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ {plan.limits.orders === -1 ? 'Pedidos ilimitados' : `${plan.limits.orders.toLocaleString()} pedidos/mês`}</li>
                <li>✓ {plan.limits.stores === -1 ? 'Canais ilimitados' : `${plan.limits.stores} canais`}</li>
                <li>✓ {plan.limits.users === -1 ? 'Usuários ilimitados' : `${plan.limits.users} usuários`}</li>
              </ul>
              {currentPlan?.key !== plan.key && (
                <Button className="w-full" onClick={() => checkout.mutate(plan.key)} disabled={checkout.isPending}>
                  Assinar {plan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
