'use client'

import type { UserTitle } from '@/lib/titles/definitions'
import { CrownIcon, ShieldIcon } from '@/design-system/icons'
import Button from '@/components/ui/Button'

function formatUnlockDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TitleCard({
  title,
  onSelect,
}: {
  title: UserTitle
  onSelect: (id: string) => void
}) {
  if (title.unlocked && title.isActive) {
    return (
      <div className="los-title-card los-title-card--active">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="los-progression-badge los-progression-badge--gold">Active Title</span>
          <CrownIcon size={18} className="text-los-gold" />
        </div>
        <h3 className="font-heading text-xl font-semibold tracking-wide text-los-gold">{title.name}</h3>
        <p className="text-sm text-los-text-secondary mt-2 leading-relaxed">{title.description}</p>
        {title.unlockedAt && (
          <p className="mt-5 pt-4 border-t border-los-border-gold text-xs text-los-text-muted">
            Earned <span className="text-los-gold font-medium">{formatUnlockDate(title.unlockedAt)}</span>
          </p>
        )}
      </div>
    )
  }

  if (title.unlocked) {
    return (
      <div className="los-title-card los-title-card--unlocked">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="los-progression-badge">Title</span>
          <span className="los-progression-badge los-progression-badge--gold">Unlocked</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="los-title-icon">
            <ShieldIcon size={20} className="text-los-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-xl font-semibold tracking-wide text-los-text-primary">
              {title.name}
            </h3>
            <p className="text-sm text-los-text-secondary mt-1 leading-relaxed">{title.description}</p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-los-border-subtle flex items-center justify-between gap-3">
          <p className="text-xs text-los-text-muted">
            {title.unlockedAt ? `Unlocked ${formatUnlockDate(title.unlockedAt)}` : 'Unlocked'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => onSelect(title.id)}>
            Equip
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="los-title-card los-title-card--locked">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="los-progression-badge los-progression-badge--muted">Title</span>
        <span className="los-progression-badge los-progression-badge--muted">Locked</span>
      </div>
      <h3 className="font-heading text-lg font-semibold tracking-wide text-los-text-muted">{title.name}</h3>
      <p className="text-sm text-los-text-muted mt-1 leading-relaxed">{title.description}</p>
      <div className="mt-5">
        <p className="los-section-label mb-2">Unlock via</p>
        <ul className="space-y-1.5">
          {title.conditions.map((condition) => (
            <li key={condition.label} className="text-xs text-los-text-muted flex items-start gap-2">
              <span className="text-los-gold mt-0.5">◇</span>
              <span>{condition.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
