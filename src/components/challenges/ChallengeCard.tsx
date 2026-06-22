import type { ChallengeInstance } from '@/lib/challenges/types'
import { MODULE_LABELS } from '@/lib/challenges/templates'

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
        className={
          challenge.completed
            ? 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5'
            : 'rounded-lg border border-gray-200 bg-white px-3 py-2.5'
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${challenge.completed ? 'text-gray-600' : 'text-gray-900'}`}>
              {challenge.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{progressLabel}</p>
          </div>
          <span
            className={
              challenge.completed
                ? 'shrink-0 text-[10px] font-semibold uppercase tracking-wider text-green-600'
                : 'shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400 tabular-nums'
            }
          >
            {challenge.completed ? 'Done' : `+${challenge.xpReward} XP`}
          </span>
        </div>
        {!challenge.completed && (
          <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${challenge.progress}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={
        challenge.completed
          ? 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
          : 'rounded-xl border border-gray-200 bg-white p-5'
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
          {MODULE_LABELS[challenge.module]}
        </span>
        <span
          className={
            challenge.completed
              ? 'text-[10px] font-semibold uppercase tracking-wider text-green-600'
              : 'text-[10px] font-semibold uppercase tracking-wider text-gray-500 tabular-nums'
          }
        >
          {challenge.completed ? 'Completed' : `+${challenge.xpReward} XP`}
        </span>
      </div>

      <p className={`font-semibold ${challenge.completed ? 'text-gray-700' : 'text-gray-900'}`}>
        {challenge.title}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{challenge.description}</p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-gray-700">{progressLabel}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${challenge.completed ? 'bg-green-600' : 'bg-gray-900'}`}
            style={{ width: `${challenge.progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 tabular-nums">{challenge.progress}% complete</p>
      </div>
    </div>
  )
}
