'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Info, CheckCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TYPE_ICON, TYPE_COLOR, TYPE_LABEL } from '@/lib/notification-constants'

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['inbox-page', unreadOnly, page],
    queryFn: async () => (await api.get('/inbox', { params: { unreadOnly, page, limit: 30 } })).data,
  })

  const markAll = useMutation({
    mutationFn: async () => api.patch('/inbox/read', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-page'] })
      qc.invalidateQueries({ queryKey: ['inbox-count'] })
    },
  })

  const markOne = useMutation({
    mutationFn: async (id: string) => api.patch('/inbox/read', { ids: [id] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-page'] })
      qc.invalidateQueries({ queryKey: ['inbox-count'] })
    },
  })

  const notifications = data?.notifications ?? []

  return (
    <div className="flex flex-col gap-5 p-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.unread > 0 ? `${data.unread} não lida(s)` : 'Tudo em dia'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
            {[{ label: 'Todas', value: false }, { label: 'Não lidas', value: true }].map((f) => (
              <button key={String(f.value)} onClick={() => { setUnreadOnly(f.value); setPage(1) }}
                className={cn('rounded-md px-3 py-1 text-xs font-semibold transition-all',
                  unreadOnly === f.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {f.label}
              </button>
            ))}
          </div>
          {data?.unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="h-3.5 w-3.5" /> Marcar tudo lido
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-semibold">Nenhuma notificação</p>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadOnly ? 'Você não tem notificações não lidas.' : 'As notificações aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n: any) => {
              const Icon = TYPE_ICON[n.type] ?? Info
              const colorCls = TYPE_COLOR[n.type] ?? 'text-muted-foreground bg-muted'
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex gap-4 px-5 py-4 hover:bg-muted/30 transition-colors',
                    !n.isRead && 'bg-primary/5'
                  )}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', colorCls)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn('text-sm', !n.isRead ? 'font-semibold' : 'font-medium')}>
                            {n.link ? (
                              <Link href={n.link} className="hover:text-primary">{n.title}</Link>
                            ) : n.title}
                          </p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {TYPE_LABEL[n.type] ?? n.type}
                          </Badge>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0"
                          onClick={() => markOne.mutate(n.id)}>
                          Lido
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t px-5 py-3">
            <span className="text-xs text-muted-foreground">Página {page} de {data.pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
