import type { ReactNode } from 'react'

interface ProgressionSectionProps {
  title: string
  subtitle?: string
  children: ReactNode
  icon?: ReactNode
}

export function ProgressionSection({ title, subtitle, children, icon }: ProgressionSectionProps) {
  return (
    <section className="los-progression-section">
      <div className="los-progression-section-header mb-5">
        <div className="flex items-center gap-2">
          {icon && <span className="text-los-gold">{icon}</span>}
          <h2 className="font-heading text-xl font-semibold tracking-wide text-los-text-primary">
            {title}
          </h2>
        </div>
        {subtitle && <p className="mt-1 text-sm text-los-text-secondary">{subtitle}</p>}
        <span className="los-progression-section-rule" aria-hidden />
      </div>
      {children}
    </section>
  )
}

export function ProgressionSubheading({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'unlocked' | 'locked'
}) {
  const color =
    variant === 'unlocked'
      ? 'text-los-gold'
      : variant === 'locked'
        ? 'text-los-text-muted'
        : 'text-los-text-muted'
  return (
    <h3 className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${color}`}>
      {children}
    </h3>
  )
}
