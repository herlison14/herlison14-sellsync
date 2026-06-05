import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  brand?: string
  ncm?: string
  gtin?: string
  weight?: number
  height?: number
  width?: number
  length?: number
  images: string[]
  attributes: Record<string, unknown>
  stockItems: Array<{ quantity: number; reserved: number; warehouse: { name: string } }>
  listings: Array<{ id: string; status: string; price: string; store: { marketplace: string } }>
  _count: { listings: number }
}

export function useProducts(search = '') {
  return useQuery<{ data: Product[]; meta: { total: number } }>({
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

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Product>) => (await api.post('/products', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Product>) => (await api.put(`/products/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['products', id] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function usePublishProduct(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { storeId: string; price: number; title?: string }) =>
      (await api.post(`/products/${productId}/publish`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', productId] }),
  })
}
