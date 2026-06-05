import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  brand?: string
  images: string[]
  stockItems: Array<{ quantity: number; reserved: number; warehouse: { name: string } }>
  listings: Array<{ id: string; status: string; price: string; store: { marketplace: string; name: string } }>
}

export function useProducts(search = '') {
  return useQuery<{ data: Product[] }>({
    queryKey: ['products', search],
    queryFn: async () => (await api.get('/products', { params: { search, limit: 50 } })).data,
  })
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: !!id,
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
