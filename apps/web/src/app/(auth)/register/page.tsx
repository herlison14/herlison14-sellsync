'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
        setError(err instanceof Error ? err.message : 'Erro ao criar conta')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Criar conta grátis</h1>
          <p className="text-sm text-muted-foreground">Comece a gerenciar seus marketplaces hoje</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200',
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('text-[11px] font-medium whitespace-nowrap', i === step ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-px mx-3 mb-5 transition-colors duration-200', i < step ? 'bg-emerald-400' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {step < 2 ? (
          <form onSubmit={handleNext} className="rounded-2xl border bg-card p-6 shadow-card space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {step === 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da empresa / loja</label>
                <Input value={form.tenantName} onChange={(e) => set('tenantName', e.target.value)}
                  required autoFocus placeholder="Ex: Minha Loja Online" />
                <p className="text-xs text-muted-foreground">Pode ser alterado depois nas configurações</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Seu nome</label>
                  <Input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus placeholder="João Silva" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="joao@empresa.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Senha</label>
                  <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="Mínimo 8 caracteres" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirmar senha</label>
                  <Input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required placeholder="••••••••" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : step === 0 ? 'Continuar →' : 'Criar conta grátis'}
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl border bg-card p-8 shadow-card text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Conta criada com sucesso!</h2>
              <p className="text-sm text-muted-foreground">Agora conecte seus marketplaces e comece a vender.</p>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => router.push('/onboarding')}>
                Configurar minha conta →
              </Button>
            </div>
          </div>
        )}

        {step < 2 && (
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
          </p>
        )}
      </div>
    </div>
  )
}
