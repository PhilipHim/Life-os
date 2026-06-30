import type { AppSettings, NotificationPreferences, PrivacyPreferences } from '@/types/settings'

const STORAGE_KEY = 'ascend_settings'

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  plannerReminders: true,
  routineReminders: true,
  aiSuggestions: true,
  achievementNotifications: true,
}

const DEFAULT_PRIVACY: PrivacyPreferences = {
  usageAnalytics: true,
  aiCoachPersonalization: true,
}

function defaultTimezone(): string {
  if (typeof Intl !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  return 'UTC'
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accent: 'gold',
  timezone: defaultTimezone(),
  username: '',
  notifications: DEFAULT_NOTIFICATIONS,
  privacy: DEFAULT_PRIVACY,
  updatedAt: Date.now(),
}

export function getAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS, timezone: defaultTimezone() }
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
      accent: parsed.accent ?? DEFAULT_SETTINGS.accent,
      timezone: parsed.timezone ?? defaultTimezone(),
      username: parsed.username ?? '',
      notifications: { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications },
      privacy: { ...DEFAULT_PRIVACY, ...parsed.privacy },
      updatedAt: parsed.updatedAt ?? Date.now(),
    }
  } catch {
    return { ...DEFAULT_SETTINGS, timezone: defaultTimezone() }
  }
}

export function saveAppSettings(settings: AppSettings): AppSettings {
  const next: AppSettings = {
    ...settings,
    updatedAt: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function patchAppSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getAppSettings()
  return saveAppSettings({
    ...current,
    ...patch,
    notifications: patch.notifications
      ? { ...current.notifications, ...patch.notifications }
      : current.notifications,
    privacy: patch.privacy ? { ...current.privacy, ...patch.privacy } : current.privacy,
  })
}
