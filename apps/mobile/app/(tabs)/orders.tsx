import { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { api } from '../../src/lib/api'

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#F59E0B', CONFIRMED: '#3B82F6', INVOICED: '#8B5CF6',
  SHIPPED: '#06B6D4', DELIVERED: '#10B981', CANCELLED: '#EF4444',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando', CONFIRMED: 'Confirmado', INVOICED: 'NF Emitida',
  READY_TO_SHIP: 'Pronto', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado',
}

interface Order {
  id: string
  externalId: string
  status: string
  marketplace: string
  buyerName: string
  total: string
  createdAt: string
}

export default function OrdersScreen() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-orders', search, status],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: { search, status, limit: 50 } })
      return data.data as Order[]
    },
  })

  function renderItem({ item }: { item: Order }) {
    const color = STATUS_COLOR[item.status] ?? '#6B7280'
    return (
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemId}>{item.externalId}</Text>
          <Text style={styles.itemBuyer}>{item.buyerName || '—'}</Text>
          <Text style={styles.itemDate}>{format(new Date(item.createdAt), 'dd/MM HH:mm', { locale: ptBR })}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemTotal}>
            {Number(item.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
          </View>
          <Text style={styles.itemMarketplace}>{item.marketplace.replace('_', ' ')}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos</Text>
        <Text style={styles.count}>{data?.length ?? 0} pedidos</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Buscar pedido, comprador..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterRow}>
        {['', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.filterBtn, status === s && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, status === s && styles.filterTextActive]}>
              {s === '' ? 'Todos' : STATUS_LABEL[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
        : <FlatList
            data={data ?? []}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido encontrado</Text>}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 13, color: '#6B7280' },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  search: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },
  item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14 },
  itemLeft: { flex: 1 },
  itemId: { fontSize: 13, fontWeight: '700', color: '#374151', fontFamily: 'monospace' },
  itemBuyer: { fontSize: 14, color: '#111827', marginTop: 2 },
  itemDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemMarketplace: { fontSize: 11, color: '#9CA3AF' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15 },
})
