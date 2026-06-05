import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../src/lib/api'

export default function NewProductScreen() {
  const router = useRouter()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    sku: '', name: '', brand: '', description: '',
    ncm: '', gtin: '', weight: '', height: '', width: '', length: '',
  })

  const create = useMutation({
    mutationFn: async (data: Record<string, unknown>) => (await api.post('/products', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      Alert.alert('Criado', 'Produto criado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: () => Alert.alert('Erro', 'Não foi possível criar o produto.'),
  })

  function setF(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSave() {
    if (!form.sku.trim() || !form.name.trim()) {
      return Alert.alert('Atenção', 'SKU e Nome são obrigatórios.')
    }
    create.mutate({
      sku: form.sku.trim(),
      name: form.name.trim(),
      brand: form.brand || undefined,
      description: form.description || undefined,
      ncm: form.ncm.replace(/\D/g, '') || undefined,
      gtin: form.gtin || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      height: form.height ? Number(form.height) : undefined,
      width: form.width ? Number(form.width) : undefined,
      length: form.length ? Number(form.length) : undefined,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Produto</Text>
        <TouchableOpacity onPress={handleSave} disabled={create.isPending} style={styles.saveBtn}>
          {create.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Criar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação</Text>

          <Text style={styles.label}>SKU *</Text>
          <TextInput style={styles.input} value={form.sku} onChangeText={(v) => setF('sku', v)} placeholder="PROD-001" autoCapitalize="characters" />

          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => setF('name', v)} placeholder="Nome do produto" />

          <Text style={styles.label}>Marca</Text>
          <TextInput style={styles.input} value={form.brand} onChangeText={(v) => setF('brand', v)} placeholder="Ex: Samsung" />

          <Text style={styles.label}>GTIN / EAN</Text>
          <TextInput style={styles.input} value={form.gtin} onChangeText={(v) => setF('gtin', v)} placeholder="7891234567890" keyboardType="numeric" />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={form.description} onChangeText={(v) => setF('description', v)}
            placeholder="Descrição detalhada..." multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classificação Fiscal</Text>
          <Text style={styles.label}>NCM (8 dígitos)</Text>
          <TextInput
            style={styles.input} value={form.ncm} onChangeText={(v) => setF('ncm', v)}
            placeholder="00000000" keyboardType="numeric" maxLength={8}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimensões e Peso</Text>
          <View style={styles.grid2}>
            {[
              { field: 'weight' as const, label: 'Peso (kg)' },
              { field: 'height' as const, label: 'Altura (cm)' },
              { field: 'width' as const, label: 'Largura (cm)' },
              { field: 'length' as const, label: 'Comprimento (cm)' },
            ].map(({ field, label }) => (
              <View key={field} style={styles.gridItem}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input} value={form[field]}
                  onChangeText={(v) => setF(field, v)}
                  placeholder="0.00" keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111827' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 12, paddingBottom: 40, gap: 12 },
  section: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#111827', backgroundColor: '#fff',
  },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '47%' },
})
