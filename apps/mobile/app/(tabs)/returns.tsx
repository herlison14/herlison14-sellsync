import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { api } from '../../src/lib/api'

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: '#F59E0B', APPROVED: '#3B82F6', REJECTED: '#EF4444',
  RECEIVED: '#8B5CF6', REFUNDED: '#10B981', CLOSED: '#6B7280',
}
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Solicitada', APPROVED: 'Aprovada', REJECTED: 'Rejeitada',
  RECEIVED: 'Recebida', REFUNDED: 'Reembolsada', CLOSED: 'Encerrada',
}
const REASON_LABEL: Record<string, string> = {
  DEFECTIVE: 'Defeito', WRONG_ITEM: 'Item errado', NOT_AS_DESCRIBED: 'Diferente do descrito',
  BUYER_CHANGED_MIND: 'Desistência', DAMAGED_IN_TRANSIT: 'Avaria no transporte', OTHER: 'Outro',
}

interface Return {
  id: string; status: string; reason: string; refundAmount: string; createdAt: string
  order: { externalId: string; marketplace: string; buyerName: string }
}

export default function ReturnsScreen() {
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-returns', statusFilter],
    queryFn: async () => (await api.get('/returns', { params: { status: statusFilter || undefined, limit: 50 } })).data,
  })

  const returns: Return[] = data?.returns ?? []

  const MP_EMOJI: Record<string, string> = {
    MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
    MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫',
  }

  function renderItem({ item }: { item: Return }) {
    const color = STATUS_COLOR[item.status] ?? '#6B7280'
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.externalId}>
              {MP_EMOJI[item.order.marketplace] ?? '🏪'} #{item.order.externalId}
            </Text>
            <Text style={styles.buyerName}>{item.order.buyerName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <Text style={styles.reason}>{REASON_LABEL[item.reason] ?? item.reason}</Text>
          <View style={styles.footerRight}>
            <Text style={styles.refund}>
              {Number(item.refundAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
            <Text style={styles.date}>
              {format(new Date(item.createdAt), "dd/MM/yy", { locale: ptBR })}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  const statuses = ['', 'REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED']

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Devoluções</Text>
        <Text style={styles.subtitle}>{data?.total ?? 0} no total</Text>
      </View>

      <View style={styles.filterScroll}>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s ? (STATUS_LABEL[s] ?? s) : 'Todas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}><Text style={styles.emptyText}>Carregando...</Text></View>
      ) : returns.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>↩️</Text>
          <Text style={styles.emptyTitle}>Nenhuma devolução</Text>
          <Text style={styles.emptyText}>Devoluções aparecerão aqui</Text>
        </View>
      ) : (
        <FlatList
          data={returns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2563EB']} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  filterScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderInfo: { flex: 1 },
  externalId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  buyerName: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reason: { fontSize: 13, color: '#374151' },
  footerRight: { alignItems: 'flex-end' },
  refund: { fontSize: 14, fontWeight: '700', color: '#111827' },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
})
