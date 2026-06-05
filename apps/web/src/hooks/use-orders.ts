import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface OrderFilters {
  page?: number
  limit?: number
  status?: string
  marketplace?: string
  search?: string
  from?: string
  to?: string
}

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: filters })
      return data
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`)
      return data
    },
    enabled: !!id,
  })
}
