'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuth()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ name: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('As senhas não conferem')
    if (form.password.length < 8) return setError('Senha deve ter no mínimo 8 caracteres')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/team/invitations/accept', {
        token,
        name: form.name.trim(),
        password: form.password,
      })
      login(res.data.token)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Convite inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm max-w-sm w-full mx-4">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-bold text-gray-900">Link inválido</h1>
          <p className="mt-2 text-sm text-gray-500">Este link de convite é inválido ou expirou.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl border bg-white p-8 shadow-sm max-w-md w-full mx-4 space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">👋</p>
          <h1 className="text-2xl font-bold text-gray-900">Você foi convidado!</h1>
          <p className="mt-2 text-sm text-gray-500">Crie sua conta para acessar o SellSync.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Seu nome completo</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="João da Silva"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Criar senha</label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar senha</label>
            <input
              type="password" required
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Repita a senha"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Criar conta e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
