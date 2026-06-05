import { useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProducts, useDeleteProduct } from '../../src/hooks/use-products'

const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
  MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫', TIKTOK_SHOP: '▶️',
}

export default function ProductsScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useProducts(search)
  const deleteProduct = useDeleteProduct()

  function confirmDelete(id: string, name: string) {
    Alert.alert('Excluir produto', `Excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: () => deleteProduct.mutate(id),
      },
    ])
  }

  const products = data?.data ?? []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Produtos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/product/new')}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou SKU..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={products.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              <TouchableOpacity onPress={() => router.push('/product/new')}>
                <Text style={styles.emptyLink}>Criar primeiro produto →</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const stock = item.stockItems.reduce((s, i) => s + i.quantity - i.reserved, 0)
          const isLow = stock <= 5
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/product/${item.id}`)}
              activeOpacity={0.8}
            >
              {item.images[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 28 }}>📦</Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.sku}>{item.sku}</Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.stock, isLow && styles.stockLow]}>
                    {stock} un. em estoque
                  </Text>
                  <View style={styles.marketplaces}>
                    {item.listings.length === 0 ? (
                      <Text style={styles.noListings}>sem anúncios</Text>
                    ) : (
                      item.listings.map((l) => (
                        <Text key={l.id} style={styles.mpEmoji}>
                          {MP_EMOJI[l.store.marketplace] ?? '🏪'}
                        </Text>
                      ))
                    )}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  addBtn: {
    backgroundColor: '#2563EB', borderRadius: 8, padding: 8,
  },
  search: {
    margin: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    fontSize: 14, color: '#111827',
  },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  emptyLink: { marginTop: 8, fontSize: 14, color: '#2563EB' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 8, padding: 10,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  thumb: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  thumbPlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  sku: { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  stock: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  stockLow: { color: '#DC2626' },
  marketplaces: { flexDirection: 'row', gap: 2 },
  mpEmoji: { fontSize: 14 },
  noListings: { fontSize: 11, color: '#D1D5DB' },
  deleteBtn: { padding: 8, marginLeft: 4 },
})
