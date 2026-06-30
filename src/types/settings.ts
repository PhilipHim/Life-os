export type ThemeMode = 'system' | 'light' | 'dark'
export type AccentColor = 'gold' | 'violet' | 'emerald'

export interface NotificationPreferences {
  plannerReminders: boolean
  routineReminders: boolean
  aiSuggestions: boolean
  achievementNotifications: boolean
}

export interface PrivacyPreferences {
  usageAnalytics: boolean
  aiCoachPersonalization: boolean
}

export interface AppSettings {
  theme: ThemeMode
  accent: AccentColor
  timezone: string
  username: string
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
  updatedAt: number
}

export type SettingsTab =
  | 'general'
  | 'account'
  | 'appearance'
  | 'notifications'
  | 'privacy'
  | 'danger'
