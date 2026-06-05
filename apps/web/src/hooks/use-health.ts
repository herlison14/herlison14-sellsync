import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type HealthStatus = 'ok' | 'token_expired' | 'error' | 'unconfigured'

export interface StoreHealth {
  storeId: string
  marketplace: string
  name: string
  status: HealthStatus
  latencyMs: number | null
  tokenExpiresAt: string | null
  lastCheckedAt: string
  errorMessage?: string
}

export function useIntegrationsHealth() {
  return useQuery<StoreHealth[]>({
    queryKey: ['integrations-health'],
    queryFn: async () => (await api.get('/integrations/health')).data,
    refetchInterval: 60_000, // auto-refresh every 60s
    staleTime: 30_000,
  })
}
