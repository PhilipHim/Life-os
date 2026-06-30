import type { ChallengeInstance } from '@/lib/challenges/types'
import { MODULE_LABELS } from '@/lib/challenges/templates'
import ProgressBar from '@/components/ui/ProgressBar'
import { StarIcon } from '@/design-system/icons'

interface ChallengeCardProps {
  challenge: ChallengeInstance
  compact?: boolean
}

export default function ChallengeCard({ challenge, compact = false }: ChallengeCardProps) {
  const progressLabel =
    challenge.target === 1 && challenge.module !== 'tasks'
      ? challenge.completed
        ? 'Done'
        : 'Pending'
      : `${challenge.current} / ${challenge.target}`

  if (compact) {
    return (
      <div
        className={`los-challenge-card los-challenge-card--compact ${
          challenge.completed ? 'los-challenge-card--completed' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                challenge.completed ? 'text-los-text-secondary' : 'text-los-text-primary'
              }`}
            >
              {challenge.title}
            </p>
            <p className="text-xs text-los-text-muted mt-0.5 tabular-nums">{progressLabel}</p>
          </div>
          {challenge.completed ? (
            <span className="shrink-0 los-progression-badge los-progression-badge--gold">Done</span>
          ) : (
            <span className="shrink-0 los-xp-reward tabular-nums">+{challenge.xpReward} XP</span>
          )}
        </div>
        {!challenge.completed && (
          <div className="mt-2">
            <ProgressBar value={challenge.progress} variant="gold" size="sm" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`los-challenge-card ${challenge.completed ? 'los-challenge-card--completed' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="los-progression-badge">{MODULE_LABELS[challenge.module]}</span>
        {challenge.completed ? (
          <span className="los-progression-badge los-progression-badge--gold">Completed</span>
        ) : (
          <span className="los-xp-reward inline-flex items-center gap-1 tabular-nums">
            <StarIcon size={12} />
            +{challenge.xpReward} XP
          </span>
        )}
      </div>

      <p
        className={`font-heading text-lg font-semibold tracking-wide ${
          challenge.completed ? 'text-los-text-secondary' : 'text-los-text-primary'
        }`}
      >
        {challenge.title}
      </p>
      <p className="text-sm text-los-text-secondary mt-1 leading-relaxed">{challenge.description}</p>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-los-text-muted">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-los-text-secondary">{progressLabel}</span>
        </div>
        <ProgressBar
          value={challenge.progress}
          variant={challenge.completed ? 'success' : 'gold'}
          size="sm"
        />
        <p className="text-xs text-los-text-muted tabular-nums">{challenge.progress}% complete</p>
      </div>
    </div>
  )
}
