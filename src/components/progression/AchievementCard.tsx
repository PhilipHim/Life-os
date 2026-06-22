import type { Achievement } from '@/lib/profile/types'
import { ACHIEVEMENT_CATEGORY_LABELS } from '@/lib/achievements'
import ProgressBar from '@/components/ui/ProgressBar'
import { TrophyIcon } from '@/design-system/icons'

function formatUnlockDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AchievementCard({ achievement }: { achievement: Achievement }) {
  if (achievement.unlocked) {
    return (
      <div className="los-achievement-card los-achievement-card--unlocked">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="los-progression-badge">{ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}</span>
          <span className="los-progression-badge los-progression-badge--gold">Unlocked</span>
        </div>

        <div className="flex items-start gap-4">
          <div className="los-achievement-icon los-achievement-icon--unlocked">
            <TrophyIcon size={22} className="text-los-text-inverse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-semibold tracking-wide text-los-text-primary">
              {achievement.title}
            </p>
            <p className="text-sm text-los-text-secondary mt-1 leading-relaxed">
              {achievement.description}
            </p>
          </div>
        </div>

        <p className="mt-5 pt-4 border-t border-los-border-subtle text-xs text-los-text-muted">
          Unlocked{' '}
          <span className="text-los-gold font-medium">
            {achievement.unlockedAt ? formatUnlockDate(achievement.unlockedAt) : 'recently'}
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="los-achievement-card los-achievement-card--locked">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="los-progression-badge los-progression-badge--muted">
          {ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}
        </span>
        <span className="los-progression-badge los-progression-badge--muted">Locked</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="los-achievement-icon los-achievement-icon--locked">
          <TrophyIcon size={22} className="text-los-text-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg font-semibold text-los-text-muted">{achievement.title}</p>
          <p className="text-sm text-los-text-muted mt-1 leading-relaxed">{achievement.description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-los-text-muted">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-los-text-secondary">
            {achievement.progressLabel}
          </span>
        </div>
        <ProgressBar value={achievement.progress} variant="gold" size="sm" />
        <p className="text-xs text-los-text-muted tabular-nums">{achievement.progress}% complete</p>
      </div>
    </div>
  )
}
