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
