'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useIntegrationsHealth, type StoreHealth, type HealthStatus } from '@/hooks/use-health'
import { api } from '@/lib/api'

const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
  MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫', TIKTOK_SHOP: '▶️',
}

const STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; dot: string }> = {
  ok:           { label: 'Operacional', color: 'text-green-700 bg-green-100', dot: 'bg-green-500' },
  token_expired:{ label: 'Token expirado', color: 'text-yellow-700 bg-yellow-100', dot: 'bg-yellow-500' },
  error:        { label: 'Erro de conexão', color: 'text-red-700 bg-red-100', dot: 'bg-red-500' },
  unconfigured: { label: 'Desconectado', color: 'text-gray-500 bg-gray-100', dot: 'bg-gray-400' },
}

function StatusBadge({ status }: { status: HealthStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function LatencyBar({ ms }: { ms: number | null }) {
  if (ms == null) return <span className="text-xs text-gray-400">—</span>
  const color = ms < 500 ? 'text-green-600' : ms < 1500 ? 'text-yellow-600' : 'text-red-600'
  return <span className={`text-xs font-mono font-semibold ${color}`}>{ms} ms</span>
}

export default function IntegrationHealthPage() {
  const qc = useQueryClient()
  const { data: stores, isLoading, dataUpdatedAt } = useIntegrationsHealth()
  const [rechecking, setRechecking] = useState<Record<string, boolean>>({})

  async function recheckStore(storeId: string) {
    setRechecking((r) => ({ ...r, [storeId]: true }))
    try {
      await api.get(`/integrations/health/${storeId}`)
      await qc.invalidateQueries({ queryKey: ['integrations-health'] })
    } finally {
      setRechecking((r) => ({ ...r, [storeId]: false }))
    }
  }

  async function recheckAll() {
    await qc.invalidateQueries({ queryKey: ['integrations-health'] })
  }

  const summary = stores ? {
    ok: stores.filter((s) => s.status === 'ok').length,
    warn: stores.filter((s) => s.status === 'token_expired').length,
    error: stores.filter((s) => s.status === 'error').length,
    total: stores.length,
  } : null

  return (
    <div className="space-y-4 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/integrations" className="text-sm text-gray-400 hover:text-gray-600">← Voltar</Link>
          <h1 className="text-2xl font-bold">Health dos Canais</h1>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-gray-400">
              Atualizado: {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={recheckAll}
            disabled={isLoading}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            ↻ Verificar tudo
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.ok}</p>
            <p className="text-xs text-gray-500 mt-1">Operacional</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{summary.warn}</p>
            <p className="text-xs text-gray-500 mt-1">Token expirado</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.error}</p>
            <p className="text-xs text-gray-500 mt-1">Com erro</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (stores ?? []).length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center text-gray-400">
          <p className="text-3xl mb-3">🔌</p>
          <p className="font-medium">Nenhum canal conectado</p>
          <Link href="/dashboard/integrations" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Conectar marketplace →
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Canal', 'Status', 'Latência', 'Token expira em', 'Última verificação', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stores ?? []).map((s) => (
                <tr key={s.storeId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{MP_EMOJI[s.marketplace] ?? '🏪'}</span>
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.marketplace.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                    {s.errorMessage && (
                      <p className="mt-1 text-xs text-red-500 max-w-xs truncate" title={s.errorMessage}>
                        {s.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <LatencyBar ms={s.latencyMs} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.tokenExpiresAt
                      ? (() => {
                          const d = new Date(s.tokenExpiresAt)
                          const diffH = Math.round((d.getTime() - Date.now()) / 3_600_000)
                          return diffH < 0
                            ? <span className="text-red-600 font-semibold">Expirado</span>
                            : diffH < 24
                            ? <span className="text-yellow-600 font-semibold">{diffH}h restantes</span>
                            : <span>{Math.round(diffH / 24)}d restantes</span>
                        })()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(s.lastCheckedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => recheckStore(s.storeId)}
                      disabled={!!rechecking[s.storeId]}
                      className="rounded-md border px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {rechecking[s.storeId] ? '...' : 'Verificar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">Atualização automática a cada 60 segundos.</p>
    </div>
  )
}
