import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../src/lib/api'

interface Store {
  id: string
  marketplace: string
  name: string
  isActive: boolean
  createdAt: string
}

const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
  MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫', TIKTOK_SHOP: '⬛',
}

export default function IntegrationsScreen() {
  const qc = useQueryClient()

  const { data: stores, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-stores'],
    queryFn: async () => {
      const { data } = await api.get('/integrations/stores')
      return data as Store[]
    },
  })

  const disconnect = useMutation({
    mutationFn: async (id: string) => api.delete(`/integrations/stores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mobile-stores'] }),
  })

  function handleDisconnect(store: Store) {
    Alert.alert(
      'Desconectar loja',
      `Deseja desconectar "${store.name}" do ${store.marketplace.replace('_', ' ')}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desconectar', style: 'destructive', onPress: () => disconnect.mutate(store.id) },
      ]
    )
  }

  const active = (stores ?? []).filter((s) => s.isActive)
  const inactive = (stores ?? []).filter((s) => !s.isActive)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Canais</Text>
        <Text style={styles.count}>{active.length} conectado(s)</Text>
      </View>

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
        : <FlatList
            data={[...active, ...inactive]}
            keyExtractor={(i) => i.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🔗</Text>
                <Text style={styles.emptyTitle}>Nenhuma loja conectada</Text>
                <Text style={styles.emptyText}>Acesse o painel web para conectar seus marketplaces</Text>
              </View>
            }
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                <View style={styles.cardLeft}>
                  <Text style={styles.mpEmoji}>{MP_EMOJI[item.marketplace] ?? '🏪'}</Text>
                  <View>
                    <Text style={styles.storeName}>{item.name}</Text>
                    <Text style={styles.mpName}>{item.marketplace.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#D1D5DB' }]} />
                  {item.isActive && (
                    <TouchableOpacity onPress={() => handleDisconnect(item)}>
                      <Text style={styles.disconnectText}>Desconectar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cardInactive: { opacity: 0.5 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mpEmoji: { fontSize: 28 },
  storeName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  mpName: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  disconnectText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 },
})
