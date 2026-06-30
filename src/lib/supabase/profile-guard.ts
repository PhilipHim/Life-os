import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { COOKIE_NAME, readOnboardingCookieUserId } from '@/database/onboarding-local'

export function hasLocalOnboardingComplete(request: NextRequest, userId: string): boolean {
  const cookieUserId = readOnboardingCookieUserId(request.cookies.get(COOKIE_NAME)?.value)
  return cookieUserId === userId
}

export async function hasCompletedOnboarding(
  supabase: SupabaseClient,
  userId: string,
  request?: NextRequest
): Promise<boolean> {
  if (request && hasLocalOnboardingComplete(request, userId)) {
    return true
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('profiles') && msg.includes('schema cache')) {
      return request ? hasLocalOnboardingComplete(request, userId) : false
    }
    return false
  }

  if (!data) return request ? hasLocalOnboardingComplete(request, userId) : false
  return !!data.onboarding_completed_at
}
