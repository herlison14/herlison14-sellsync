import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data } = await api.get('/integrations/stores')
      return data as Array<{ id: string; marketplace: string; name: string; isActive: boolean; createdAt: string }>
    },
  })
}

export function useDisconnectStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (storeId: string) => {
      await api.delete(`/integrations/stores/${storeId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
  })
}

// Canal sem OAuth (loja própria) — conecta com um token fixo em vez de
// redirecionar pra um provedor externo.
export function useConnectManualStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ path, token, name }: { path: string; token: string; name?: string }) => {
      const { data } = await api.post(`/integrations/${path}/connect`, { token, name })
      return data as { id: string }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
  })
}

export function useImportLojaDescartaveisCatalog() {
  return useMutation({
    mutationFn: async (storeId: string) => {
      const { data } = await api.post('/integrations/lojadescartaveis/import', { storeId })
      return data as { imported: number; total: number }
    },
  })
}
