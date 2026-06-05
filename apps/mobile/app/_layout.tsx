import { useEffect, useRef } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../src/lib/auth'
import { syncPushToken } from '../src/lib/notifications'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function AuthGuard() {
  const { isAuthenticated, isLoading, hydrate } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const notifListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (isLoading) return
    const inAuth = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/login')
    if (isAuthenticated && inAuth) router.replace('/(tabs)/dashboard')
  }, [isAuthenticated, isLoading, segments])

  useEffect(() => {
    if (!isAuthenticated) return

    syncPushToken()

    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // notification received while app is in foreground — badge handled by handler
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>
      if (data?.type === 'new_order') router.push('/orders' as any)
      if (data?.type === 'low_stock') router.push('/inventory' as any)
    })

    return () => {
      notifListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [isAuthenticated])

  return null
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
