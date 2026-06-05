import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { api } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    const { status: asked } = await Notifications.requestPermissionsAsync()
    status = asked
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SellSync',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export async function syncPushToken(): Promise<void> {
  const token = await registerPushToken()
  if (token) {
    try {
      await api.post('/notifications/push-token', { token, platform: Platform.OS })
    } catch {
      // non-critical — silently fail
    }
  }
}
