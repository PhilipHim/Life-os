import type { Session, User } from '@supabase/supabase-js'

export type AuthUser = User
export type AuthSession = Session

export interface AuthResult {
  error: string | null
  needsEmailConfirmation?: boolean
}

export interface SignUpInput {
  email: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}
