const STORAGE_KEY = 'ascend_onboarding'
const COOKIE_NAME = 'ascend_onboarded'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

interface LocalOnboardingRecord {
  userId: string
  completedAt: number
}

export function isProfilesTableError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('profiles') &&
    (lower.includes('schema cache') ||
      lower.includes('does not exist') ||
      lower.includes('could not find the table'))
  )
}

export function markOnboardingCompleteLocal(userId: string): void {
  if (typeof window === 'undefined') return

  const record: LocalOnboardingRecord = {
    userId,
    completedAt: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(userId)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function isOnboardingCompleteLocal(userId: string): boolean {
  if (typeof window === 'undefined') return false
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as LocalOnboardingRecord
    return parsed.userId === userId && parsed.completedAt > 0
  } catch {
    return false
  }
}

export function readOnboardingCookieUserId(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null
  try {
    return decodeURIComponent(cookieValue)
  } catch {
    return cookieValue
  }
}

export { COOKIE_NAME }
