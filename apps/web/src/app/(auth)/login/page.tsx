'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result?.requires2fa && result.tempToken) {
        setTempToken(result.tempToken)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify2fa(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/2fa/verify', { token: totpCode, tempToken })
      localStorage.setItem('sellsync:token', data.token)
      router.push('/dashboard')
    } catch {
      setError('Código incorreto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (tempToken) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar px-4">
        <div className="bg-grid absolute inset-0" />
        <div
          className="bg-glow absolute inset-0"
          style={{ '--glow-x': '50%', '--glow-y': '0%' } as React.CSSProperties}
        />
        <div className="relative w-full max-w-sm space-y-6 animate-fade-in rounded-2xl border border-sidebar-border bg-sidebar/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar-accent/15">
              <ShieldCheck className="h-7 w-7 text-sidebar-accent" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Autenticação em 2 fatores</h1>
            <p className="text-sm text-sidebar-muted-foreground">Digite o código de 6 dígitos do seu autenticador</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <form onSubmit={handleVerify2fa} className="space-y-4">
            <Input
              value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="h-14 border-sidebar-border bg-sidebar-hover text-center font-mono text-2xl tracking-[0.5em] text-sidebar-foreground placeholder:text-sidebar-muted-foreground/40"
              maxLength={6} autoFocus inputMode="numeric"
            />
            <Button type="submit" className="w-full shadow-glow" disabled={totpCode.length !== 6 || loading}>
              {loading ? 'Verificando...' : 'Verificar'}
            </Button>
          </form>
          <button onClick={() => setTempToken('')} className="w-full text-center text-sm text-sidebar-muted-foreground hover:text-sidebar-foreground">
            ← Voltar ao login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding, mesma identidade visual da sidebar do
          dashboard (grafite escuro + índigo), pra login e app parecerem
          o mesmo produto. */}
      <div className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
        <div className="bg-grid absolute inset-0" />
        <div
          className="bg-glow absolute inset-0"
          style={{ '--glow-x': '15%', '--glow-y': '10%' } as React.CSSProperties}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-accent shadow-glow">
            <Zap className="h-5 w-5 text-sidebar-accent-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">SellSync</span>
            <p className="text-[11px] leading-none text-sidebar-muted-foreground">Hub Multichannel</p>
          </div>
        </div>

        <div className="relative max-w-sm space-y-6">
          <h2 className="text-3xl font-bold leading-snug text-balance">
            Todos os seus marketplaces, um único painel de controle
          </h2>
          <p className="text-base leading-relaxed text-sidebar-muted-foreground">
            Mercado Livre, Shopee, Amazon, Magalu e mais. Estoque, pedidos, precificação e NF-e sincronizados em tempo real.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { n: '7+', label: 'Marketplaces' },
              { n: '100%', label: 'Automatizado' },
              { n: 'NF-e', label: 'Integrado' },
              { n: 'D+0', label: 'Sincronização' },
            ].map(({ n, label }) => (
              <div key={n} className="rounded-xl border border-sidebar-border bg-sidebar-hover p-3">
                <p className="font-mono text-lg font-bold tabular-nums text-sidebar-accent">{n}</p>
                <p className="text-xs text-sidebar-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-sidebar-muted-foreground/70">
          &copy; {new Date().getFullYear()} SellSync. Gestão multichannel para quem vende em todo lugar.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in space-y-6">
          <div className="space-y-1">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">
                <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-foreground">SellSync</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">Entre com sua conta para continuar</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••" className="pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full shadow-glow" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
