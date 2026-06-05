import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#E5E7EB', paddingBottom: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Pedidos', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ title: 'Estoque', tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Produtos', tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="integrations"
        options={{ title: 'Canais', tabBarIcon: ({ color, size }) => <Ionicons name="link-outline" size={size} color={color} /> }}
      />
    </Tabs>
  )
}
