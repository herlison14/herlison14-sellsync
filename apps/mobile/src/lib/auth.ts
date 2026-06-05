import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api } from './api'

interface AuthState {
  token: string | null
  user: { id: string; name: string; email: string } | null
  tenant: { id: string; name: string; plan: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('sellsync:token', data.token)
    set({ token: data.token, user: data.user, tenant: data.tenant, isAuthenticated: true })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('sellsync:token')
    set({ token: null, user: null, tenant: null, isAuthenticated: false })
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('sellsync:token')
      if (!token) return set({ isLoading: false })
      const { data } = await api.get('/auth/me')
      set({ token, user: data, tenant: data.tenant, isAuthenticated: true })
    } catch {
      await SecureStore.deleteItemAsync('sellsync:token')
    } finally {
      set({ isLoading: false })
    }
  },
}))
