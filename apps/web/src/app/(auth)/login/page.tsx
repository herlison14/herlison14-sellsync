'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch {
      setError('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 text-primary-foreground">
        <div className="max-w-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Zap className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight">SellSync</span>
          </div>
          <h2 className="text-3xl font-bold leading-snug">
            Gerencie todos os seus marketplaces em um só lugar
          </h2>
          <p className="text-primary-foreground/70 text-base leading-relaxed">
            ML, Shopee, Amazon, Magalu e muito mais. Estoque, pedidos e NF-e centralizados.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { n: '7+', label: 'Marketplaces' },
              { n: '100%', label: 'Automatizado' },
              { n: 'NF-e', label: 'Integrado' },
              { n: 'Real-time', label: 'Sincronização' },
            ].map(({ n, label }) => (
              <div key={n} className="rounded-xl bg-white/10 p-3">
                <p className="text-lg font-bold">{n}</p>
                <p className="text-xs text-primary-foreground/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
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
            <Button type="submit" className="w-full" disabled={loading}>
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
