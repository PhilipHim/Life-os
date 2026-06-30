import { createClient } from '@/lib/supabase/client'
import { mapAuthError } from './messages'
import type { AuthResult, SignInInput, SignUpInput } from './types'

const MIN_PASSWORD_LENGTH = 8

function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.'
  }
  return null
}

function toAuthResult(error: { message: string } | null, extra?: Partial<AuthResult>): AuthResult {
  if (error) {
    return { error: mapAuthError(error.message), ...extra }
  }
  return { error: null, ...extra }
}

function getSiteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

export async function signUp({ email, password }: SignUpInput): Promise<AuthResult> {
  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${getSiteOrigin()}/auth/callback?next=/dashboard`,
      },
    })

    if (error) return toAuthResult(error)

    const needsEmailConfirmation = !data.session
    return { error: null, needsEmailConfirmation }
  } catch {
    return { error: mapAuthError('Network error') }
  }
}

export async function signIn({ email, password }: SignInInput): Promise<AuthResult> {
  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  if (!password) return { error: 'Password is required.' }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    return toAuthResult(error)
  } catch {
    return { error: mapAuthError('Network error') }
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return toAuthResult(error)
  } catch {
    return { error: mapAuthError('Network error') }
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${getSiteOrigin()}/auth/callback?next=/reset-password`,
    })

    return toAuthResult(error)
  } catch {
    return { error: mapAuthError('Network error') }
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    return toAuthResult(error)
  } catch {
    return { error: mapAuthError('Network error') }
  }
}
