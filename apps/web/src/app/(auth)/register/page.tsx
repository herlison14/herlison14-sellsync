'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

const STEPS = ['Empresa', 'Sua conta', 'Pronto!'] as const

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ tenantName: '', name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (step === 0) {
      if (!form.tenantName.trim()) return setError('Informe o nome da empresa')
      return setStep(1)
    }
    if (step === 1) {
      if (!form.name.trim()) return setError('Informe seu nome')
      if (!form.email.trim()) return setError('Informe seu e-mail')
      if (form.password.length < 8) return setError('A senha deve ter no mínimo 8 caracteres')
      if (form.password !== form.confirmPassword) return setError('As senhas não coincidem')

      setLoading(true)
      try {
        await register(form.tenantName, form.name, form.email, form.password)
        setStep(2)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao criar conta'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white text-xl font-bold">S</div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta grátis</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie seus marketplaces em um só lugar</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step < 2 ? (
          <form onSubmit={handleNext} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>
            )}

            {step === 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome da empresa / loja</label>
                <input
                  type="text"
                  value={form.tenantName}
                  onChange={(e) => set('tenantName', e.target.value)}
                  required autoFocus
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Minha Loja Online"
                />
                <p className="mt-1 text-xs text-gray-400">Pode ser alterado depois nas configurações</p>
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Seu nome</label>
                  <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="João Silva" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="joao@empresa.com" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
                  <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar senha</label>
                  <input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Criando conta...' : step === 0 ? 'Continuar →' : 'Criar conta grátis'}
            </button>
          </form>
        ) : (
          <div className="rounded-xl border bg-white p-8 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">🎉</div>
            <h2 className="text-lg font-bold text-gray-900">Conta criada com sucesso!</h2>
            <p className="text-sm text-gray-500">Agora conecte seus marketplaces e comece a gerenciar suas vendas.</p>
            <button onClick={() => router.push('/dashboard/integrations')}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Conectar marketplace →
            </button>
            <button onClick={() => router.push('/dashboard')} className="w-full text-sm text-gray-500 hover:text-gray-700">
              Ir para o dashboard
            </button>
          </div>
        )}

        {step < 2 && (
          <p className="text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
          </p>
        )}
      </div>
    </div>
  )
}
