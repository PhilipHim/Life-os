import { createClient } from '@/lib/supabase/client'
import {
  isProfilesTableError,
  markOnboardingCompleteLocal,
} from '@/database/onboarding-local'
import type { FocusArea, OnboardingPayload, UserProfile } from '@/types/profile'

interface ProfileRow {
  id: string
  display_name: string
  active_title_id: string
  onboarding_completed_at: string | null
  focus_areas: string[] | null
  vision: string | null
  wake_up_time: string | null
  bedtime: string | null
  deep_work_time: string | null
  workout_time: string | null
  first_mission_completed_at: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    activeTitleId: row.active_title_id,
    onboardingCompletedAt: row.onboarding_completed_at,
    focusAreas: (row.focus_areas ?? []) as FocusArea[],
    vision: row.vision,
    wakeUpTime: row.wake_up_time,
    bedtime: row.bedtime,
    deepWorkTime: row.deep_work_time,
    workoutTime: row.workout_time,
    firstMissionCompletedAt: row.first_mission_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function ensureUserProfile(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' })
  if (error && isProfilesTableError(error.message)) return
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return mapRow(data as ProfileRow)
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const { isOnboardingCompleteLocal } = await import('@/database/onboarding-local')
  if (isOnboardingCompleteLocal(userId)) return true
  const profile = await fetchUserProfile(userId)
  return !!profile?.onboardingCompletedAt
}

export async function saveOnboarding(
  userId: string,
  payload: Partial<OnboardingPayload>,
  options: { completed: boolean }
): Promise<{ error: string | null }> {
  const supabase = createClient()

  const update: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  }

  if (payload.focusAreas !== undefined) update.focus_areas = payload.focusAreas
  if (payload.vision !== undefined) update.vision = payload.vision.trim() || null

  if (options.completed) {
    update.onboarding_completed_at = new Date().toISOString()
  }

  const { error } = await supabase.from('profiles').upsert(update, { onConflict: 'id' })

  if (error) {
    if (isProfilesTableError(error.message) && options.completed) {
      markOnboardingCompleteLocal(userId)
      return { error: null }
    }
    return { error: error.message }
  }

  if (options.completed) {
    markOnboardingCompleteLocal(userId)
  }
  return { error: null }
}

export async function completeOnboarding(
  userId: string,
  payload: OnboardingPayload
): Promise<{ error: string | null }> {
  return saveOnboarding(userId, payload, { completed: true })
}

export async function skipOnboarding(userId: string): Promise<{ error: string | null }> {
  return saveOnboarding(userId, {}, { completed: true })
}

export async function updateDisplayName(
  userId: string,
  displayName: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: displayName.trim() || 'Explorer',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) return { error: error.message }
  return { error: null }
}

export async function completeFirstMission(
  userId: string,
  activeTitleId?: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const update: Record<string, unknown> = {
    id: userId,
    first_mission_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (activeTitleId) {
    update.active_title_id = activeTitleId
  }

  const { error } = await supabase.from('profiles').upsert(update, { onConflict: 'id' })
  if (error) return { error: error.message }
  return { error: null }
}

export async function isFirstMissionComplete(userId: string): Promise<boolean> {
  const profile = await fetchUserProfile(userId)
  return !!profile?.firstMissionCompletedAt
}
