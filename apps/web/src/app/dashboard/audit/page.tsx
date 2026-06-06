'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Search, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ACTION_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  CREATE: { label: 'Criou',    variant: 'success' },
  UPDATE: { label: 'Editou',   variant: 'warning' },
  DELETE: { label: 'Removeu',  variant: 'destructive' },
  BULK:   { label: 'Lote',     variant: 'secondary' },
  LOGIN:  { label: 'Login',    variant: 'secondary' },
  EXPORT: { label: 'Exportou', variant: 'secondary' },
}

const ENTITIES = ['Listing', 'Product', 'Order', 'PricingRule', 'RepricingRule', 'Supplier', 'PurchaseOrder', 'StockItem', 'Return']

type Log = {
  id: string; action: string; entity: string; entityId?: string
  userId?: string; userName?: string; ip?: string
  before?: Record<string, unknown>; after?: Record<string, unknown>
  createdAt: string
}

function DiffView({ before, after }: { before?: Record<string, unknown>; after?: Record<string, unknown> }) {
  if (!before && !after) return null
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
  const changed = keys.filter((k) => JSON.stringify((before ?? {})[k]) !== JSON.stringify((after ?? {})[k]))
  if (changed.length === 0) return <span className="text-xs text-muted-foreground">Sem campos alterados</span>

  return (
    <div className="space-y-1 mt-2">
      {changed.map((k) => (
        <div key={k} className="flex items-start gap-2 text-xs">
          <span className="font-mono text-muted-foreground w-28 shrink-0">{k}</span>
          {before && (before as any)[k] !== undefined && (
            <span className="line-through text-red-500 font-mono truncate max-w-[120px]">
              {String((before as any)[k])}
            </span>
          )}
          {after && (after as any)[k] !== undefined && (
            <span className="text-emerald-600 font-mono truncate max-w-[120px]">
              → {String((after as any)[k])}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function LogRow({ log }: { log: Log }) {
  const [open, setOpen] = useState(false)
  const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, variant: 'secondary' as const }
  const hasDiff = log.before || log.after

  return (
    <div className={cn('border-b last:border-0', hasDiff && 'cursor-pointer')}
      onClick={() => hasDiff && setOpen((v) => !v)}>
      <div className={cn('flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors', open && 'bg-muted/10')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
            <span className="text-sm font-medium">{log.entity}</span>
            {log.entityId && <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">{log.entityId}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{log.userName ?? log.userId ?? 'sistema'}</span>
            {log.ip && <span className="text-xs text-muted-foreground/60 font-mono">{log.ip}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
          </span>
          {hasDiff && (
            open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                 : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>
      {open && hasDiff && (
        <div className="px-4 pb-3 pt-0 bg-muted/5 ml-11">
          <DiffView before={log.before as any} after={log.after as any} />
        </div>
      )}
    </div>
  )
}

export default function AuditPage() {
  const [entity, setEntity] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entity, page],
    queryFn: async () => (await api.get('/audit', { params: { entity: entity || undefined, page, limit: 50 } })).data,
  })

  const logs: Log[] = data?.logs ?? []

  return (
    <div className="flex flex-col gap-5 p-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log de Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rastreie todas as ações realizadas na plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {[{ v: '', l: 'Todos' }, ...ENTITIES.map((e) => ({ v: e, l: e }))].map((f) => (
            <button key={f.v} onClick={() => { setEntity(f.v); setPage(1) }}
              className={cn('rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                entity === f.v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && logs.length === 0 && (
          <div className="py-16 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="font-semibold text-muted-foreground">Nenhum registro encontrado</p>
            <p className="text-xs text-muted-foreground/60 mt-1">As ações dos membros da equipe aparecerão aqui</p>
          </div>
        )}
        {!isLoading && logs.map((log) => <LogRow key={log.id} log={log} />)}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {data.total} registros · página {page} de {data.pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
