'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function BulkActionsBar({ selectedIds, onClear }: { selectedIds: string[]; onClear: () => void }) {
  const queryClient = useQueryClient()

  const printLabels = useMutation({
    mutationFn: async () => {
      const res = await api.post('/orders/bulk/print-labels', { orderIds: selectedIds }, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url)
    },
  })

  const emitNfe = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedIds.map((id) => api.post(`/orders/${id}/invoice`)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      onClear()
    },
  })

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
      <span className="text-sm font-medium text-blue-800">{selectedIds.length} selecionados</span>
      <div className="flex gap-2 ml-auto">
        <button
          onClick={() => printLabels.mutate()}
          disabled={printLabels.isPending}
          className="rounded-md bg-white border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Imprimir Etiquetas
        </button>
        <button
          onClick={() => emitNfe.mutate()}
          disabled={emitNfe.isPending}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {emitNfe.isPending ? 'Emitindo...' : 'Emitir NF-e'}
        </button>
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-gray-700 px-2">
          Limpar
        </button>
      </div>
    </div>
  )
}
