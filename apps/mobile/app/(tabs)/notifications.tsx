import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { api } from '../../src/lib/api'

const TYPE_COLOR: Record<string, string> = {
  NEW_ORDER: '#3B82F6', ORDER_CANCELLED: '#EF4444',
  LOW_STOCK: '#F59E0B', STOCK_OUT: '#DC2626',
  PRICE_CHANGED: '#10B981', NF_E_ISSUED: '#3B82F6',
  NF_E_ERROR: '#EF4444', RETURN_REQUESTED: '#F97316',
  INTEGRATION_ERROR: '#EF4444', SYSTEM: '#6B7280',
}

const TYPE_EMOJI: Record<string, string> = {
  NEW_ORDER: '📦', ORDER_CANCELLED: '❌', LOW_STOCK: '⚠️',
  STOCK_OUT: '🚨', PRICE_CHANGED: '💰', NF_E_ISSUED: '📄',
  NF_E_ERROR: '❗', RETURN_REQUESTED: '↩️', INTEGRATION_ERROR: '🔌', SYSTEM: 'ℹ️',
}

interface Notification {
  id: string; type: string; title: string; body?: string; isRead: boolean; createdAt: string
}

export default function NotificationsScreen() {
  const qc = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-notifications', unreadOnly],
    queryFn: async () => (await api.get('/inbox', { params: { unreadOnly, limit: 50 } })).data,
    refetchInterval: 30_000,
  })

  const markAll = useMutation({
    mutationFn: async () => api.patch('/inbox/read', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mobile-notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: async (id: string) => api.patch('/inbox/read', { ids: [id] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mobile-notifications'] }),
  })

  const notifications: Notification[] = data?.notifications ?? []
  const unreadCount: number = data?.unread ?? 0

  function renderItem({ item }: { item: Notification }) {
    const color = TYPE_COLOR[item.type] ?? '#6B7280'
    const emoji = TYPE_EMOJI[item.type] ?? 'ℹ️'
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => { if (!item.isRead) markOne.mutate(item.id) }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={[styles.dot, { backgroundColor: color }]} />}
          </View>
          {item.body && <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>}
          <Text style={styles.itemTime}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificações</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} não lida(s)</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAll.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Marcar tudo lido</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {[{ label: 'Todas', value: false }, { label: 'Não lidas', value: true }].map((f) => (
          <TouchableOpacity
            key={String(f.value)}
            onPress={() => setUnreadOnly(f.value)}
            style={[styles.filterBtn, unreadOnly === f.value && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, unreadOnly === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>Tudo em dia</Text>
          <Text style={styles.emptyText}>
            {unreadOnly ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação ainda.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2563EB']} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

import { useState } from 'react'

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  markAllBtn: { paddingTop: 4 },
  markAllText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  item: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff' },
  itemUnread: { backgroundColor: '#EFF6FF' },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  itemTitle: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  itemTitleBold: { fontWeight: '700', color: '#111827' },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  itemBody: { fontSize: 13, color: '#6B7280', marginBottom: 4, lineHeight: 18 },
  itemTime: { fontSize: 11, color: '#9CA3AF' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
})
