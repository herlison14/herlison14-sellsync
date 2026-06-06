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
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
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
        name="notifications"
        options={{ title: 'Alertas', tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="returns"
        options={{ title: 'Devoluções', tabBarIcon: ({ color, size }) => <Ionicons name="return-down-back-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="integrations" options={{ href: null }} />
    </Tabs>
  )
}
