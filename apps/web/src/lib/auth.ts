import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from './api'

interface User {
  id: string
  name: string
  email: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
}

interface AuthState {
  token: string | null
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (tenantName: string, name: string, email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenant: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        localStorage.setItem('sellsync:token', data.token)
        set({ token: data.token, user: data.user, tenant: data.tenant, isAuthenticated: true })
      },

      register: async (tenantName, name, email, password) => {
        const { data } = await api.post('/auth/register', { tenantName, name, email, password })
        localStorage.setItem('sellsync:token', data.token)
        set({ token: data.token, user: data.user, tenant: data.tenant, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('sellsync:token')
        set({ token: null, user: null, tenant: null, isAuthenticated: false })
      },

      hydrate: async () => {
        const token = get().token
        if (!token) return
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data, tenant: data.tenant, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },
    }),
    { name: 'sellsync:auth', partialize: (s) => ({ token: s.token, user: s.user, tenant: s.tenant }) },
  ),
)
