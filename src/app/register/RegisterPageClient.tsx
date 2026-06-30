'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import AuthShell, { AuthMessage } from '@/components/auth/AuthShell'
import { AUTH_SUCCESS, signUp } from '@/services/auth'

export default function RegisterPageClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const result = await signUp({ email, password })
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.needsEmailConfirmation) {
      setSuccess(AUTH_SUCCESS.registrationCheckEmail)
      return
    }

    setSuccess(AUTH_SUCCESS.registrationComplete)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building your character with ASCEND."
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-los-gold hover:text-los-gold-light">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthMessage tone="error">{error}</AuthMessage>}
        {success && <AuthMessage tone="success">{success}</AuthMessage>}

        <div>
          <label htmlFor="register-email" className="los-section-label mb-1.5 block">
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className="los-section-label mb-1.5 block">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="los-input w-full"
            placeholder="At least 8 characters"
            required
          />
          <p className="mt-1.5 text-xs text-los-text-muted">
            Use at least 8 characters with letters and numbers.
          </p>
        </div>

        <div>
          <label htmlFor="register-confirm" className="los-section-label mb-1.5 block">
            Confirm password
          </label>
          <input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="los-input w-full"
            placeholder="Repeat your password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !!success}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
