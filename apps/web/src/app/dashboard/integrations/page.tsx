'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'
import { useStores } from '@/hooks/use-stores'
import { MarketplaceCard } from '@/components/integrations/marketplace-card'
import { Button } from '@/components/ui/button'

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
    <div className="flex flex-col gap-5 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conecte seus marketplaces e gerencie tudo em um só lugar</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/integrations/health">
            <Activity className="h-4 w-4" /> Status de conexão
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_MARKETPLACES.map((mp) => {
          const connected = stores?.filter((s) => s.marketplace === mp.id) ?? []
          return <MarketplaceCard key={mp.id} marketplace={mp} connectedStores={connected} />
        })}
      </div>
    </div>
  )
}
