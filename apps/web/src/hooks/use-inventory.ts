import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useInventory(filters: { warehouseId?: string; lowStock?: boolean; search?: string } = {}) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      const { data } = await api.get('/inventory', { params: filters })
      return data
    },
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, warehouseId, quantity, reason }: {
      productId: string
      warehouseId: string
      quantity: number
      reason?: string
    }) => {
      const { data } = await api.post(`/inventory/${productId}/adjust`, { warehouseId, quantity, reason })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
