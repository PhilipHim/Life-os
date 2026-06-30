'use client'

import { markHintDismissed } from '@/database/first-experience'
import type { ContextualHintSection } from '@/types/first-experience'
import { useFirstExperience } from '@/hooks/useFirstExperience'

interface ContextualHintProps {
  section: ContextualHintSection
  message: string
}

export default function ContextualHint({ section, message }: ContextualHintProps) {
  const { active, state } = useFirstExperience()

  if (!active || state.hintsDismissed[section]) return null

  const dismiss = () => markHintDismissed(section)

  return (
    <div className="los-contextual-hint flex items-start justify-between gap-3 rounded-xl border border-los-border-gold/40 bg-los-gold/5 px-4 py-3">
      <p className="text-sm text-los-text-secondary">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-xs font-medium text-los-text-muted transition-colors hover:text-los-text-secondary"
      >
        Got it
      </button>
    </div>
  )
}

export function useContextualHint(section: ContextualHintSection) {
  const { active, state } = useFirstExperience()

  const dismissHint = () => {
    if (active && !state.hintsDismissed[section]) {
      markHintDismissed(section)
    }
  }

  const showHint = active && !state.hintsDismissed[section]

  return { showHint, dismissHint, active }
}
