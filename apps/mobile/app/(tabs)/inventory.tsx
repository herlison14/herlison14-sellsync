import { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../src/lib/api'

interface StockItem {
  id: string
  quantity: number
  reserved: number
  minAlert: number
  product: { id: string; sku: string; name: string }
  warehouse: { name: string }
}

export default function InventoryScreen() {
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-inventory', search],
    queryFn: async () => {
      const { data } = await api.get('/inventory', { params: { search } })
      return data as StockItem[]
    },
  })

  function renderItem({ item }: { item: StockItem }) {
    const available = item.quantity - item.reserved
    const isOut = item.quantity === 0
    const isLow = !isOut && available <= item.minAlert

    return (
      <View style={[styles.item, isOut && styles.itemOut, isLow && styles.itemLow]}>
        <View style={styles.itemMain}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
          <Text style={styles.itemSku}>{item.product.sku} · {item.warehouse.name}</Text>
        </View>
        <View style={styles.itemStock}>
          {isOut && <View style={styles.tagOut}><Text style={styles.tagOutText}>Zerado</Text></View>}
          {isLow && !isOut && <View style={styles.tagLow}><Text style={styles.tagLowText}>Baixo</Text></View>}
          <Text style={[styles.qty, isOut ? styles.qtyOut : isLow ? styles.qtyLow : styles.qtyOk]}>
            {available}
          </Text>
          <Text style={styles.qtyLabel}>disponível</Text>
        </View>
      </View>
    )
  }

  const lowCount = (data ?? []).filter((i) => i.quantity - i.reserved <= i.minAlert).length

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Estoque</Text>
        {lowCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{lowCount} crítico(s)</Text>
          </View>
        )}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Buscar produto ou SKU..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
        : <FlatList
            data={data ?? []}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum item encontrado</Text>}
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
  alertBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  alertBadgeText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
  searchRow: { paddingHorizontal: 16, paddingBottom: 12 },
  search: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14 },
  itemOut: { backgroundColor: '#FFF5F5' },
  itemLow: { backgroundColor: '#FFFBEB' },
  itemMain: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSku: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemStock: { alignItems: 'flex-end', gap: 2 },
  tagOut: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagOutText: { color: '#DC2626', fontSize: 10, fontWeight: '700' },
  tagLow: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagLowText: { color: '#D97706', fontSize: 10, fontWeight: '700' },
  qty: { fontSize: 22, fontWeight: '800' },
  qtyOk: { color: '#111827' },
  qtyLow: { color: '#D97706' },
  qtyOut: { color: '#DC2626' },
  qtyLabel: { fontSize: 11, color: '#9CA3AF' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15 },
})
