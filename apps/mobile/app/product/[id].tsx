import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../src/lib/api'
import { useProduct } from '../../src/hooks/use-products'

const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡', SHOPEE: '🟠', AMAZON: '🔵',
  MAGALU: '🟢', AMERICANAS: '🔴', SHEIN: '⚫', TIKTOK_SHOP: '▶️',
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: product, isLoading } = useProduct(id)
  const { data: storesData } = useQuery<{ data: Array<{ id: string; name: string; marketplace: string; isActive: boolean }> }>({
    queryKey: ['stores'],
    queryFn: async () => (await api.get('/integrations/stores')).data,
  })

  const update = useMutation({
    mutationFn: async (data: Record<string, unknown>) => (await api.put(`/products/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      Alert.alert('Salvo', 'Produto atualizado com sucesso.')
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar o produto.'),
  })

  const publish = useMutation({
    mutationFn: async (data: { storeId: string; price: number; title?: string }) =>
      (await api.post(`/products/${id}/publish`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', id] })
      setShowPublish(false)
      setPublishForm({ storeId: '', price: '', title: '' })
      Alert.alert('Publicado', 'Anúncio criado com sucesso.')
    },
    onError: () => Alert.alert('Erro', 'Não foi possível publicar o anúncio.'),
  })

  const [form, setForm] = useState<Record<string, string>>({})
  const [showPublish, setShowPublish] = useState(false)
  const [publishForm, setPublishForm] = useState({ storeId: '', price: '', title: '' })
  const [storePickerOpen, setStorePickerOpen] = useState(false)

  if (isLoading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  const f = (field: string) => (field in form ? form[field] : (product as Record<string, unknown>)[field] as string ?? '')

  function setF(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    const data: Record<string, unknown> = {
      name: f('name').trim(),
      sku: f('sku').trim(),
      brand: f('brand') || undefined,
      description: f('description') || undefined,
    }
    if (!data.name || !data.sku) return Alert.alert('Atenção', 'SKU e Nome são obrigatórios.')
    update.mutate(data)
  }

  function handlePublish() {
    if (!publishForm.storeId) return Alert.alert('Atenção', 'Selecione um canal.')
    if (!publishForm.price) return Alert.alert('Atenção', 'Informe o preço de venda.')
    publish.mutate({
      storeId: publishForm.storeId,
      price: Number(publishForm.price),
      title: publishForm.title || undefined,
    })
  }

  const activeStores = (storesData?.data ?? []).filter((s) => s.isActive)
  const totalStock = product.stockItems.reduce((s, i) => s + i.quantity - i.reserved, 0)
  const selectedStore = activeStores.find((s) => s.id === publishForm.storeId)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={handleSave} disabled={update.isPending} style={styles.saveBtn}>
          {update.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image */}
        {product.images[0] && (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        )}

        {/* Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          <Text style={styles.label}>SKU *</Text>
          <TextInput style={styles.input} value={f('sku')} onChangeText={(v) => setF('sku', v)} placeholder="PROD-001" />
          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={f('name')} onChangeText={(v) => setF('name', v)} placeholder="Nome do produto" />
          <Text style={styles.label}>Marca</Text>
          <TextInput style={styles.input} value={f('brand')} onChangeText={(v) => setF('brand', v)} placeholder="Ex: Samsung" />
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={f('description')} onChangeText={(v) => setF('description', v)}
            placeholder="Descrição detalhada..." multiline
          />
        </View>

        {/* Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estoque</Text>
          <Text style={styles.stockText}>
            Total disponível: <Text style={{ fontWeight: '700', color: totalStock <= 5 ? '#DC2626' : '#059669' }}>{totalStock} un.</Text>
          </Text>
          {product.stockItems.map((item, i) => (
            <View key={i} style={styles.stockRow}>
              <Text style={styles.warehouseName}>{item.warehouse.name}</Text>
              <Text style={styles.warehouseQty}>{item.quantity - item.reserved} un. disponível</Text>
            </View>
          ))}
        </View>

        {/* Listings */}
        <View style={styles.section}>
          <View style={styles.listingsHeader}>
            <Text style={styles.sectionTitle}>Anúncios Ativos</Text>
            <TouchableOpacity style={styles.publishBtn} onPress={() => setShowPublish((v) => !v)}>
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={styles.publishBtnText}>Publicar</Text>
            </TouchableOpacity>
          </View>

          {product.listings.length === 0 && (
            <Text style={styles.noListingsText}>Nenhum anúncio publicado ainda.</Text>
          )}

          {product.listings.map((l) => (
            <View key={l.id} style={styles.listingRow}>
              <Text style={styles.listingEmoji}>{MP_EMOJI[l.store.marketplace] ?? '🏪'}</Text>
              <Text style={styles.listingMarket}>{l.store.marketplace.replace('_', ' ')}</Text>
              <Text style={styles.listingPrice}>
                {Number(l.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
              <View style={[styles.statusBadge, l.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusText, l.status === 'ACTIVE' ? styles.statusActiveText : styles.statusInactiveText]}>
                  {l.status}
                </Text>
              </View>
            </View>
          ))}

          {/* Publish form */}
          {showPublish && (
            <View style={styles.publishForm}>
              <Text style={styles.publishFormTitle}>Novo Anúncio</Text>

              {/* Store picker */}
              <Text style={styles.label}>Canal *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setStorePickerOpen((v) => !v)}
              >
                <Text style={{ color: selectedStore ? '#111827' : '#9CA3AF', fontSize: 14 }}>
                  {selectedStore
                    ? `${MP_EMOJI[selectedStore.marketplace] ?? '🏪'} ${selectedStore.name}`
                    : 'Selecionar canal...'}
                </Text>
                <Ionicons name={storePickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
              </TouchableOpacity>
              {storePickerOpen && (
                <View style={styles.pickerDropdown}>
                  {activeStores.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setPublishForm((f) => ({ ...f, storeId: s.id }))
                        setStorePickerOpen(false)
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {MP_EMOJI[s.marketplace] ?? '🏪'} {s.name} ({s.marketplace})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Preço de venda (R$) *</Text>
              <TextInput
                style={styles.input} keyboardType="decimal-pad"
                value={publishForm.price}
                onChangeText={(v) => setPublishForm((f) => ({ ...f, price: v }))}
                placeholder="0.00"
              />

              <Text style={styles.label}>Título (opcional)</Text>
              <TextInput
                style={styles.input}
                value={publishForm.title}
                onChangeText={(v) => setPublishForm((f) => ({ ...f, title: v }))}
                placeholder={product.name}
              />

              <View style={styles.publishActions}>
                <TouchableOpacity
                  style={styles.publishConfirmBtn}
                  onPress={handlePublish}
                  disabled={publish.isPending}
                >
                  {publish.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.publishConfirmText}>Publicar Agora</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPublish(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111827' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { paddingBottom: 40 },
  image: { width: '100%', height: 200, backgroundColor: '#F3F4F6' },
  section: {
    margin: 12, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#111827', backgroundColor: '#fff',
  },
  stockText: { fontSize: 14, color: '#374151' },
  stockRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  warehouseName: { fontSize: 13, color: '#374151' },
  warehouseQty: { fontSize: 13, fontWeight: '600', color: '#374151' },
  listingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2563EB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
  },
  publishBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  noListingsText: { fontSize: 13, color: '#9CA3AF' },
  listingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  listingEmoji: { fontSize: 16 },
  listingMarket: { flex: 1, fontSize: 13, fontWeight: '500', color: '#374151' },
  listingPrice: { fontSize: 13, fontWeight: '700', color: '#059669' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusActiveText: { color: '#065F46' },
  statusInactiveText: { color: '#6B7280' },
  publishForm: {
    borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 12, gap: 6,
  },
  publishFormTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  pickerDropdown: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    backgroundColor: '#fff', marginTop: -4,
  },
  pickerItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  pickerItemText: { fontSize: 14, color: '#374151' },
  publishActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  publishConfirmBtn: {
    flex: 1, backgroundColor: '#2563EB', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  publishConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: '#374151' },
})
