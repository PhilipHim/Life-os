import type { ProfileProgress } from '@/lib/profile/types'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { CrownIcon } from '@/design-system/icons'

interface LevelProgressPanelProps {
  progress: ProfileProgress
}

export default function LevelProgressPanel({ progress }: LevelProgressPanelProps) {
  return (
    <Card variant="gold" className="p-6 mb-3 los-level-progress-panel">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="los-level-emblem" style={{ width: '5rem', height: '5rem' }}>
            <span className="los-level-emblem-ring" />
            <span className="font-heading text-3xl font-bold tabular-nums text-los-gold">
              {progress.level}
            </span>
          </div>
          <div>
            <p className="los-section-label mb-1">Current Level</p>
            <div className="flex items-center gap-2">
              <CrownIcon size={16} className="text-los-gold" />
              <p className="font-heading text-xl font-semibold tracking-wide text-los-gold">
                {progress.title}
              </p>
            </div>
            <p className="mt-1 text-sm text-los-text-muted tabular-nums">
              {progress.totalXp.toLocaleString()} total XP · {progress.xpRemaining.toLocaleString()} to next level
            </p>
          </div>
        </div>
        <div className="sm:w-64 w-full space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="los-section-label">Level {progress.level} → {progress.level + 1}</span>
            <span className="font-medium tabular-nums text-los-gold">{progress.progressPct}%</span>
          </div>
          <ProgressBar value={progress.progressPct} variant="gold" size="md" />
        </div>
      </div>
    </Card>
  )
}
