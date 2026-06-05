import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../src/lib/api'
import { useAuth } from '../../src/lib/auth'

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const { user, tenant, logout } = useAuth()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: async () => {
      const [overview, lowStock, stores] = await Promise.all([
        api.get('/reports/overview', { params: { days: 7 } }),
        api.get('/inventory/alerts/low-stock'),
        api.get('/integrations/stores'),
      ])
      return {
        revenue: overview.data.totalRevenue,
        orders: overview.data.totalOrders,
        lowStock: lowStock.data.length,
        stores: stores.data.filter((s: { isActive: boolean }) => s.isActive).length,
      }
    },
  })

  const currency = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.tenantName}>{tenant?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Últimos 7 dias</Text>

        <View style={styles.grid}>
          <StatCard label="Receita"          value={isLoading ? '...' : currency(data?.revenue ?? 0)} color="#1D4ED8" />
          <StatCard label="Pedidos"          value={isLoading ? '...' : String(data?.orders ?? 0)}   color="#111827" />
          <StatCard label="Estoque Baixo"    value={isLoading ? '...' : String(data?.lowStock ?? 0)} color="#DC2626" />
          <StatCard label="Canais Ativos"    value={isLoading ? '...' : String(data?.stores ?? 0)}   color="#059669" />
        </View>

        {(data?.lowStock ?? 0) > 0 && (
          <View style={styles.alert}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>{data?.lowStock} produto(s) com estoque baixo</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#111827' },
  tenantName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '47%', borderWidth: 1, borderColor: '#E5E7EB' },
  cardLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '800' },
  alert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, gap: 8 },
  alertIcon: { fontSize: 18 },
  alertText: { fontSize: 13, color: '#92400E', fontWeight: '600', flex: 1 },
})
