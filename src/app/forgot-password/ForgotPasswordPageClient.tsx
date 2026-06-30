'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import AuthShell, { AuthMessage } from '@/components/auth/AuthShell'
import { AUTH_SUCCESS, requestPasswordReset } from '@/services/auth'

export default function ForgotPasswordPageClient() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    const result = await requestPasswordReset(email)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(AUTH_SUCCESS.resetEmailSent)
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We will email you a secure link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-los-gold hover:text-los-gold-light">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthMessage tone="error">{error}</AuthMessage>}
        {success && <AuthMessage tone="success">{success}</AuthMessage>}

        <div>
          <label htmlFor="reset-email" className="los-section-label mb-1.5 block">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="los-input w-full"
            placeholder="you@example.com"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !!success}>
          {submitting ? 'Sending link…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  )
}
