'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import AuthShell, { AuthMessage } from '@/components/auth/AuthShell'
import { signIn } from '@/services/auth'

export default function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const callbackError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    callbackError === 'auth_callback_failed'
      ? 'Sign-in link expired or is invalid. Please try again.'
      : null
  )
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await signIn({ email, password })
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(next.startsWith('/') ? next : '/dashboard')
    router.refresh()
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your ASCEND journey."
      footer={
        <p>
          New to ASCEND?{' '}
          <Link href="/register" className="font-medium text-los-gold hover:text-los-gold-light">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthMessage tone="error">{error}</AuthMessage>}

        <div>
          <label htmlFor="login-email" className="los-section-label mb-1.5 block">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="los-input w-full"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="los-section-label">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-los-text-muted hover:text-los-gold"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="los-input w-full"
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
