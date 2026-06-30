const STORAGE_KEY = 'life_os_profile'

export interface ProfileSettings {
  displayName: string
  activeTitleId: string
  updatedAt: number
}

const DEFAULT_SETTINGS: ProfileSettings = {
  displayName: 'Explorer',
  activeTitleId: 'beginner',
  updatedAt: Date.now(),
}

export function getProfileSettings(): ProfileSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>
    return {
      displayName: parsed.displayName?.trim() || DEFAULT_SETTINGS.displayName,
      activeTitleId: parsed.activeTitleId || DEFAULT_SETTINGS.activeTitleId,
      updatedAt: parsed.updatedAt || Date.now(),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveProfileSettings(settings: ProfileSettings): ProfileSettings {
  const next = {
    displayName: settings.displayName.trim() || DEFAULT_SETTINGS.displayName,
    activeTitleId: settings.activeTitleId || DEFAULT_SETTINGS.activeTitleId,
    updatedAt: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function saveActiveTitle(titleId: string): ProfileSettings {
  const current = getProfileSettings()
  return saveProfileSettings({ ...current, activeTitleId: titleId })
}
