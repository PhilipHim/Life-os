'use client'

interface SettingsToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function SettingsToggle({ label, description, checked, onChange }: SettingsToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-los-border bg-los-bg-secondary/40 px-4 py-3.5 transition-colors hover:border-los-border-gold/30">
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-los-text-primary">{label}</span>
        {description && (
          <span className="block text-xs text-los-text-secondary">{description}</span>
        )}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`block h-7 w-12 rounded-full border transition-colors ${
            checked
              ? 'border-los-gold/50 bg-los-gold/20'
              : 'border-los-border bg-los-bg-card'
          }`}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full shadow transition-transform ${
            checked ? 'translate-x-5 bg-los-gold' : 'bg-los-text-muted'
          }`}
          aria-hidden
        />
      </span>
    </label>
  )
}

interface SettingsFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function SettingsField({ label, hint, children }: SettingsFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-los-text-primary">{label}</span>
      {children}
      {hint && <p className="text-xs text-los-text-muted">{hint}</p>}
    </label>
  )
}

interface SettingsRowProps {
  label: string
  value: string
}

export function SettingsRow({ label, value }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-los-border bg-los-bg-secondary/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-los-text-secondary">{label}</span>
      <span className="text-sm font-medium text-los-text-primary">{value}</span>
    </div>
  )
}

interface SettingsSectionHeaderProps {
  title: string
  description: string
}

export function SettingsSectionHeader({ title, description }: SettingsSectionHeaderProps) {
  return (
    <header className="space-y-1 border-b border-los-border-subtle pb-5">
      <h2 className="font-heading text-xl font-semibold text-los-text-primary">{title}</h2>
      <p className="text-sm text-los-text-secondary">{description}</p>
    </header>
  )
}
