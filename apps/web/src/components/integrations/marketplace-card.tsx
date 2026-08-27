'use client'

import { useState } from 'react'
import { useDisconnectStore, useConnectManualStore, useImportLojaDescartaveisCatalog } from '@/hooks/use-stores'

interface MarketplaceInfo {
  id: string
  name: string
  logo: string
  oauthPath: string
  manualConnect?: boolean
  connectSlug?: string
}

interface ConnectedStore {
  id: string
  name: string
  isActive: boolean
}

export function MarketplaceCard({ marketplace, connectedStores }: { marketplace: MarketplaceInfo; connectedStores: ConnectedStore[] }) {
  const disconnect = useDisconnectStore()
  const connectManual = useConnectManualStore()
  const importCatalog = useImportLojaDescartaveisCatalog()
  const [tokenInput, setTokenInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const isConnected = connectedStores.some((s) => s.isActive)

  function handleConnect() {
    if (marketplace.manualConnect) {
      setShowForm(true)
      return
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/integrations/${marketplace.id.toLowerCase().replace('_', '')}/connect`
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    connectManual.mutate(
      { path: marketplace.connectSlug ?? '', token: tokenInput, name: marketplace.name },
      { onSuccess: () => { setShowForm(false); setTokenInput('') } },
    )
  }

  if (marketplace.manualConnect && showForm && !isConnected) {
    return (
      <div className="rounded-lg border bg-white p-5 flex flex-col gap-3">
        <h3 className="font-semibold">Conectar {marketplace.name}</h3>
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">
            Token de integração (o mesmo valor de LOJADESCARTAVEIS_API_TOKEN)
          </label>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            required
            minLength={16}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Cole o token aqui"
          />
          {connectManual.isError && (
            <p className="text-xs text-red-500">Não foi possível conectar. Confira o token.</p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={connectManual.isPending}
              className="flex-1 rounded-md bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {connectManual.isPending ? 'Conectando...' : 'Conectar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-600">
          {marketplace.name[0]}
        </div>
        <div>
          <h3 className="font-semibold">{marketplace.name}</h3>
          <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            {isConnected ? `${connectedStores.length} loja(s) conectada(s)` : 'Não conectado'}
          </span>
        </div>
        <div className={`ml-auto h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>

      {connectedStores.filter((s) => s.isActive).map((store) => (
        <div key={store.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
          <span className="text-sm font-medium">{store.name}</span>
          <button
            onClick={() => disconnect.mutate(store.id)}
            disabled={disconnect.isPending}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Desconectar
          </button>
        </div>
      ))}

      {marketplace.manualConnect && isConnected ? (
        <div className="mt-auto flex flex-col gap-1.5">
          <button
            onClick={() => {
              const store = connectedStores.find((s) => s.isActive)
              if (!store) return
              importCatalog.mutate(store.id, {
                onSuccess: (data) => setImportResult(`${data.imported}/${data.total} produtos importados`),
                onError: () => setImportResult('Falha ao importar — confira os logs'),
              })
            }}
            disabled={importCatalog.isPending}
            className="w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            {importCatalog.isPending ? 'Importando catálogo...' : 'Importar catálogo'}
          </button>
          {importResult && <p className="text-center text-xs text-gray-500">{importResult}</p>}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="mt-auto w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Conectar {isConnected ? 'outra loja' : marketplace.name}
        </button>
      )}
    </div>
  )
}
