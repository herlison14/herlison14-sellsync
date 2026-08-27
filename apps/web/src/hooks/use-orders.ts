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
  // A API valida status/marketplace como enum — mandar '' (valor default
  // de "nenhum filtro selecionado" nos <select>) quebra com 400/500 em
  // vez de ser tratado como "sem filtro". Remove qualquer campo vazio
  // antes de montar a query string.
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params })
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
