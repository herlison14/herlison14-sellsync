'use client'

import { useCreateProduct } from '@/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'

export default function NewProductPage() {
  const create = useCreateProduct()
  return <ProductForm title="Novo Produto" onSubmit={(data) => create.mutateAsync(data)} />
}
