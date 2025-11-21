'use client'

import { FormEvent, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { TextInput } from '@/components/form/TextInput'
import { SubmitButton } from '@/components/form/SubmitButton'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { signIn, user, loading, processing } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-textPrimary">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-borderSoft border-t-primary" />
          <p className="text-sm text-textSecondary">Validando sessão...</p>
        </div>
      </div>
    )
  }

  if (user) {
    router.push(redirectTo)
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await signIn({ email, password })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível acessar sua conta.'
      setError(message)
    }
  }

  return (
    <div className="flex min-h-screen bg-surface text-textPrimary">
      <div className="relative m-auto w-full max-w-md rounded-3xl border border-borderSoft bg-[var(--surface-elevated)] p-10 shadow-card">
        <div className="mb-8 space-y-2 text-center">
          <Image src="/logo-scorefy.png" alt="Scorefy" width={148} height={148} className="mx-auto" priority />
          <h1 className="text-3xl font-bold">Acesse o painel</h1>
          <p className="text-sm text-textSecondary">
            Entre com suas credenciais para acompanhar partidas, súmulas e estatísticas em tempo real.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-textSecondary">
              E-mail
            </label>
            <TextInput
              id="email"
              type="email"
              placeholder="exemplo@scorify.com"
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              required
              disabled={processing}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-textSecondary">
              Senha
            </label>
            <TextInput
              id="password"
              type="password"
              placeholder="Sua senha segura"
              autoComplete="off"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              required
              disabled={processing}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <SubmitButton label={processing ? 'Entrando...' : 'Entrar'} loading={processing} />
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-textSecondary">
          <span>Ainda sem acesso? Solicite ao administrador.</span>
          <Link
            href="/recuperar-senha"
            className="font-medium text-secondary transition hover:text-secondary/80"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  )
}
