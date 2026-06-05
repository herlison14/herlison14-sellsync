'use client'

import { useDisconnectStore } from '@/hooks/use-stores'

interface MarketplaceInfo {
  id: string
  name: string
  logo: string
  oauthPath: string
}

interface ConnectedStore {
  id: string
  name: string
  isActive: boolean
}

export function MarketplaceCard({ marketplace, connectedStores }: { marketplace: MarketplaceInfo; connectedStores: ConnectedStore[] }) {
  const disconnect = useDisconnectStore()
  const isConnected = connectedStores.some((s) => s.isActive)

  function handleConnect() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/integrations/${marketplace.id.toLowerCase().replace('_', '')}/connect`
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

      <button
        onClick={handleConnect}
        className="mt-auto w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Conectar {isConnected ? 'outra loja' : marketplace.name}
      </button>
    </div>
  )
}
