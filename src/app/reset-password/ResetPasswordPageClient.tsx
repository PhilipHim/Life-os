'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import AuthShell, { AuthMessage } from '@/components/auth/AuthShell'
import { AUTH_SUCCESS, updatePassword } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'

export default function ResetPasswordPageClient() {
  const router = useRouter()
  const { loading } = useAuth()
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
    const result = await updatePassword(password)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(AUTH_SUCCESS.passwordUpdated)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1200)
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-los-text-muted">Loading…</div>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a strong password for your ASCEND account."
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
          <label htmlFor="new-password" className="los-section-label mb-1.5 block">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="los-input w-full"
            placeholder="At least 8 characters"
            required
          />
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="los-section-label mb-1.5 block">
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
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
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
