'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Loader2, Printer, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BulkActionsBar({ selectedIds, onClear }: { selectedIds: string[]; onClear: () => void }) {
  const queryClient = useQueryClient()
  const [queued, setQueued] = useState<number | null>(null)

  const printLabels = useMutation({
    mutationFn: async () => {
      const res = await api.post('/orders/bulk/print-labels', { orderIds: selectedIds }, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url)
    },
  })

  const batchEmit = useMutation({
    mutationFn: async () => (await api.post('/nfe/batch-emit', { orderIds: selectedIds })).data,
    onSuccess: (data) => {
      setQueued(data.queued)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setTimeout(() => {
        setQueued(null)
        onClear()
      }, 3000)
    },
  })

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors',
      queued !== null
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-blue-200 bg-blue-50'
    )}>
      <span className={cn('text-sm font-semibold', queued !== null ? 'text-emerald-800' : 'text-blue-800')}>
        {queued !== null
          ? `${queued} NF-e(s) enfileiradas para emissão`
          : `${selectedIds.length} pedido(s) selecionado(s)`}
      </span>

      {queued === null && (
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printLabels.mutate()}
            disabled={printLabels.isPending}
          >
            {printLabels.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Printer className="h-3.5 w-3.5" />}
            Imprimir Etiquetas
          </Button>

          <Button
            size="sm"
            onClick={() => batchEmit.mutate()}
            disabled={batchEmit.isPending}
          >
            {batchEmit.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FileText className="h-3.5 w-3.5" />}
            {batchEmit.isPending
              ? `Enfileirando ${selectedIds.length} NF-e...`
              : 'Emitir NF-e'}
          </Button>

          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
