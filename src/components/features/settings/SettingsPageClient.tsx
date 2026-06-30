'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DangerActionModal from '@/components/features/settings/DangerActionModal'
import {
  SettingsField,
  SettingsRow,
  SettingsSectionHeader,
  SettingsToggle,
} from '@/components/features/settings/SettingsPrimitives'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { getProfileSettings, saveProfileSettings } from '@/database/profile'
import { getAppSettings, patchAppSettings } from '@/database/settings'
import { updateDisplayName } from '@/database/user-profile'
import { RESET_DATA_ITEMS, resetAllAppData } from '@/lib/reset-app-data'
import { updatePassword } from '@/services/auth'
import type { AccentColor, SettingsTab, ThemeMode } from '@/types/settings'
import {
  AlertTriangleIcon,
  BellIcon,
  GearIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
} from '@/design-system/icons'

const TABS: { id: SettingsTab; label: string; icon: typeof GearIcon }[] = [
  { id: 'general', label: 'General', icon: GearIcon },
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'privacy', label: 'Privacy', icon: ShieldIcon },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangleIcon },
]

const ACCENT_OPTIONS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: 'gold', label: 'Gold', swatch: '#d4af37' },
  { id: 'violet', label: 'Violet', swatch: '#8b5cf6' },
  { id: 'emerald', label: 'Emerald', swatch: '#10b981' },
]

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function getTimezoneOptions(): string[] {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      return (Intl as typeof Intl & { supportedValuesOf: (key: string) => string[] }).supportedValuesOf(
        'timeZone'
      )
    } catch {
      // fall through
    }
  }
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
  ]
}

function formatDate(value: string | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getAuthProvider(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '—'
  const provider =
    user.app_metadata?.provider ??
    user.identities?.[0]?.provider ??
    (user.email ? 'email' : 'unknown')
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function SettingsPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  const { theme, accent, setTheme, setAccent } = useTheme()

  const activeTab = (searchParams.get('tab') as SettingsTab) || 'general'

  const [displayName, setDisplayName] = useState('Explorer')
  const [username, setUsername] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [notifications, setNotifications] = useState(getAppSettings().notifications)
  const [privacy, setPrivacy] = useState(getAppSettings().privacy)
  const [savedHint, setSavedHint] = useState<string | null>(null)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [dangerProcessing, setDangerProcessing] = useState(false)
  const [dangerError, setDangerError] = useState<string | null>(null)

  const timezoneOptions = useMemo(() => getTimezoneOptions(), [])

  useEffect(() => {
    const profile = getProfileSettings()
    const settings = getAppSettings()
    setDisplayName(profile.displayName)
    setUsername(settings.username)
    setTimezone(settings.timezone)
    setNotifications(settings.notifications)
    setPrivacy(settings.privacy)
  }, [])

  const flashSaved = useCallback((message = 'Saved') => {
    setSavedHint(message)
    const timer = window.setTimeout(() => setSavedHint(null), 2000)
    return () => window.clearTimeout(timer)
  }, [])

  const setTab = (tab: SettingsTab) => {
    router.replace(`/settings?tab=${tab}`, { scroll: false })
  }

  const handleDisplayNameBlur = async () => {
    const trimmed = displayName.trim() || 'Explorer'
    setDisplayName(trimmed)
    saveProfileSettings({ ...getProfileSettings(), displayName: trimmed, updatedAt: Date.now() })
    if (user?.id) {
      await updateDisplayName(user.id, trimmed)
    }
    flashSaved()
  }

  const handleUsernameBlur = () => {
    patchAppSettings({ username: username.trim() })
    flashSaved()
  }

  const handleTimezoneChange = (value: string) => {
    setTimezone(value)
    patchAppSettings({ timezone: value })
    flashSaved()
  }

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const next = { ...notifications, [key]: value }
    setNotifications(next)
    patchAppSettings({ notifications: next })
  }

  const handlePrivacyChange = (key: keyof typeof privacy, value: boolean) => {
    const next = { ...privacy, [key]: value }
    setPrivacy(next)
    patchAppSettings({ privacy: next })
  }

  const handlePasswordSubmit = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordSubmitting(true)
    const result = await updatePassword(newPassword)
    setPasswordSubmitting(false)
    if (result.error) {
      setPasswordError(result.error)
      return
    }
    setPasswordSuccess('Password updated successfully.')
    setNewPassword('')
    setConfirmPassword('')
    setShowPasswordForm(false)
  }

  const handleResetConfirm = () => {
    setDangerProcessing(true)
    resetAllAppData()
    window.setTimeout(() => {
      window.location.href = '/dashboard'
    }, 400)
  }

  const handleDeleteConfirm = async () => {
    setDangerProcessing(true)
    setDangerError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setDangerError(data.error ?? 'Could not delete account.')
        setDangerProcessing(false)
        return
      }
      resetAllAppData()
      await signOut()
      router.push('/')
      router.refresh()
    } catch {
      setDangerError('Network error. Please try again.')
      setDangerProcessing(false)
    }
  }

  return (
    <div className="los-page los-settings-page">
      <header className="los-page-header los-page-header--split gap-2">
        <div className="los-page-header__lead">
          <h1 className="los-page-title">Settings</h1>
          <p className="mt-1 text-sm text-los-text-secondary">
            Manage your account, preferences, and data.
          </p>
        </div>
        {savedHint && (
          <div className="los-page-header__actions">
            <span className="text-sm font-medium text-los-success">{savedHint}</span>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <nav
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="Settings sections"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isDanger = tab.id === 'danger'
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`los-settings-nav-item shrink-0 ${isActive ? 'los-settings-nav-item--active' : ''} ${isDanger ? 'text-los-danger' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} className={isDanger ? 'text-los-danger' : undefined} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <Card className="los-settings-panel min-h-[28rem]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <SettingsSectionHeader
                title="General"
                description="Personalize how you appear in ASCEND."
              />
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-los-border-gold bg-los-bg-secondary text-lg font-semibold text-los-gold"
                  aria-hidden
                >
                  {initials(displayName)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-los-text-primary">Profile picture</p>
                  <p className="text-xs text-los-text-muted">Upload coming soon</p>
                </div>
              </div>
              <SettingsField label="Display Name">
                <input
                  className="los-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => void handleDisplayNameBlur()}
                  autoComplete="name"
                />
              </SettingsField>
              <SettingsField
                label="Username"
                hint="Optional handle for your profile. Full username support is coming soon."
              >
                <input
                  className="los-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleUsernameBlur}
                  placeholder="yourname"
                  autoComplete="username"
                />
              </SettingsField>
              <SettingsField label="Timezone" hint="Used for scheduling and reminders.">
                <select
                  className="los-select"
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </SettingsField>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <SettingsSectionHeader
                title="Account"
                description="Your ASCEND account details and security."
              />
              <SettingsRow label="Email Address" value={user?.email ?? '—'} />
              <SettingsRow label="Account Created" value={formatDate(user?.created_at)} />
              <SettingsRow
                label="Last Login"
                value={formatDate(user?.last_sign_in_at ?? undefined)}
              />
              <SettingsRow label="Authentication Provider" value={getAuthProvider(user)} />

              <div className="space-y-3 border-t border-los-border-subtle pt-5">
                <h3 className="text-sm font-semibold text-los-text-primary">Change Password</h3>
                {!showPasswordForm ? (
                  <Button variant="secondary" onClick={() => setShowPasswordForm(true)}>
                    Update password
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-los-border bg-los-bg-secondary/40 p-4">
                    <SettingsField label="New Password">
                      <input
                        type="password"
                        className="los-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </SettingsField>
                    <SettingsField label="Confirm Password">
                      <input
                        type="password"
                        className="los-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </SettingsField>
                    {passwordError && (
                      <p className="text-sm text-red-300" role="alert">
                        {passwordError}
                      </p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-emerald-300" role="status">
                        {passwordSuccess}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => void handlePasswordSubmit()}
                        disabled={passwordSubmitting}
                      >
                        {passwordSubmitting ? 'Saving…' : 'Save password'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordError(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <SettingsSectionHeader
                title="Appearance"
                description="Customize how ASCEND looks and feels."
              />
              <div className="space-y-3">
                <p className="text-sm font-medium text-los-text-primary">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                        theme === option.id
                          ? 'border-los-border-gold bg-los-gold/10 text-los-gold'
                          : 'border-los-border bg-los-bg-secondary/40 text-los-text-primary hover:border-los-border-gold/40'
                      }`}
                      aria-pressed={theme === option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-los-text-primary">Accent Color</p>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAccent(option.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                        accent === option.id
                          ? 'border-los-border-gold bg-los-gold/10 text-los-gold'
                          : 'border-los-border bg-los-bg-secondary/40 text-los-text-primary hover:border-los-border-gold/40'
                      }`}
                      aria-pressed={accent === option.id}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ backgroundColor: option.swatch }}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <SettingsSectionHeader
                title="Notifications"
                description="Choose what ASCEND should notify you about. Delivery is coming soon — preferences are saved now."
              />
              <div className="space-y-3">
                <SettingsToggle
                  label="Planner Reminders"
                  description="Nudges before scheduled focus blocks and plan items."
                  checked={notifications.plannerReminders}
                  onChange={(v) => handleNotificationChange('plannerReminders', v)}
                />
                <SettingsToggle
                  label="Routine Reminders"
                  description="Alerts when routines are due."
                  checked={notifications.routineReminders}
                  onChange={(v) => handleNotificationChange('routineReminders', v)}
                />
                <SettingsToggle
                  label="AI Suggestions"
                  description="Insights and recommendations from your AI Coach."
                  checked={notifications.aiSuggestions}
                  onChange={(v) => handleNotificationChange('aiSuggestions', v)}
                />
                <SettingsToggle
                  label="Achievement Notifications"
                  description="Celebrate level-ups, titles, and milestones."
                  checked={notifications.achievementNotifications}
                  onChange={(v) => handleNotificationChange('achievementNotifications', v)}
                />
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <SettingsSectionHeader
                title="Privacy"
                description="Your data stays on your device and in your account. ASCEND uses it only to power your experience."
              />
              <p className="rounded-xl border border-los-border bg-los-bg-secondary/40 px-4 py-3.5 text-sm leading-relaxed text-los-text-secondary">
                ASCEND stores productivity, health, and progression data to help you grow. We do not
                sell your data. You control what features can use your activity for insights and AI
                coaching.
              </p>
              <div className="space-y-3">
                <SettingsToggle
                  label="Usage insights"
                  description="Allow ASCEND to analyze patterns for analytics and trends."
                  checked={privacy.usageAnalytics}
                  onChange={(v) => handlePrivacyChange('usageAnalytics', v)}
                />
                <SettingsToggle
                  label="AI Coach personalization"
                  description="Let the AI Coach use your habits and planner data for recommendations."
                  checked={privacy.aiCoachPersonalization}
                  onChange={(v) => handlePrivacyChange('aiCoachPersonalization', v)}
                />
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <SettingsSectionHeader
                title="Danger Zone"
                description="Irreversible actions. Proceed only if you are certain."
              />
              {dangerError && (
                <p className="rounded-lg border border-los-danger/40 bg-los-danger/10 px-3 py-2 text-sm text-red-300">
                  {dangerError}
                </p>
              )}
              <div className="space-y-4 rounded-xl border border-los-danger/30 bg-los-danger/5 p-5">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-300">Reset All Data</h3>
                  <p className="text-sm text-los-text-secondary">
                    Permanently remove all local ASCEND data — tasks, planner, routines, journal,
                    health, analytics, XP, and achievements.
                  </p>
                  <Button variant="danger" onClick={() => setResetModalOpen(true)}>
                    Reset all data
                  </Button>
                </div>
                <div className="h-px bg-los-danger/20" />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-300">Delete Account</h3>
                  <p className="text-sm text-los-text-secondary">
                    Permanently delete your ASCEND account and all associated cloud profile data.
                  </p>
                  <Button variant="dangerGhost" onClick={() => setDeleteModalOpen(true)}>
                    Delete account
                  </Button>
                </div>
              </div>
              <p className="text-xs text-los-text-muted">
                Need help?{' '}
                <Link href="/" className="text-los-gold hover:text-los-gold-light">
                  Return home
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>

      <DangerActionModal
        open={resetModalOpen}
        title="Reset all data?"
        description="This will permanently erase your local ASCEND progress."
        items={RESET_DATA_ITEMS}
        warning="Everything listed below will be permanently removed from this device."
        slideLabel="Slide to reset all data"
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetConfirm}
        confirming={dangerProcessing}
      />

      <DangerActionModal
        open={deleteModalOpen}
        title="Delete your account?"
        description="This permanently removes your ASCEND account."
        items={[
          'Your authentication account',
          'Cloud profile and onboarding data',
          'All local app data on this device',
        ]}
        warning="Your account and all associated data will be permanently deleted. You will be signed out immediately."
        slideLabel="Slide to delete account"
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        confirming={dangerProcessing}
      />
    </div>
  )
}
