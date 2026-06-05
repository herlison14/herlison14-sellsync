'use client'

import Link from 'next/link'
import { useStores } from '@/hooks/use-stores'
import { MarketplaceCard } from '@/components/integrations/marketplace-card'

const AVAILABLE_MARKETPLACES = [
  { id: 'MERCADO_LIVRE', name: 'Mercado Livre', logo: '/ml.svg', oauthPath: '/integrations/mercadolivre/connect' },
  { id: 'SHOPEE', name: 'Shopee', logo: '/shopee.svg', oauthPath: '/integrations/shopee/connect' },
  { id: 'AMAZON', name: 'Amazon', logo: '/amazon.svg', oauthPath: '/integrations/amazon/connect' },
  { id: 'MAGALU', name: 'Magazine Luiza', logo: '/magalu.svg', oauthPath: '/integrations/magalu/connect' },
  { id: 'AMERICANAS', name: 'Americanas', logo: '/americanas.svg', oauthPath: '/integrations/americanas/connect' },
]

export default function IntegrationsPage() {
  const { data: stores } = useStores()

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrações</h1>
          <p className="text-gray-500">Conecte suas lojas nos marketplaces</p>
        </div>
        <Link
          href="/dashboard/integrations/health"
          className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          📊 Ver status de conexão
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_MARKETPLACES.map((mp) => {
          const connected = stores?.filter((s) => s.marketplace === mp.id) ?? []
          return (
            <MarketplaceCard
              key={mp.id}
              marketplace={mp}
              connectedStores={connected}
            />
          )
        })}
      </div>
    </div>
  )
}
