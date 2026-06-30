'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import { StarIcon } from '@/design-system/icons'
import type { FirstMissionProgress } from '@/types/first-experience'
import { FIRST_MISSION_XP } from '@/types/first-experience'

const OBJECTIVES: {
  key: keyof FirstMissionProgress
  label: string
  href: string
  cta: string
}[] = [
  { key: 'task', label: 'Create your first Task', href: '/work', cta: 'Go to Tasks' },
  { key: 'routine', label: 'Create your first Routine', href: '/routines', cta: 'Go to Routines' },
  { key: 'planner', label: 'Open the Planner', href: '/plan', cta: 'Open Planner' },
  {
    key: 'activity',
    label: 'Complete one activity',
    href: '/work',
    cta: 'Complete something',
  },
]

interface FirstMissionCardProps {
  objectives: FirstMissionProgress
}

export default function FirstMissionCard({ objectives }: FirstMissionCardProps) {
  const completedCount = Object.values(objectives).filter(Boolean).length
  const progressPct = Math.round((completedCount / OBJECTIVES.length) * 100)

  return (
    <Card className="los-first-mission space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-los-gold">
            Your First Mission
          </p>
          <h2 className="font-heading text-xl font-semibold text-los-text-primary">
            Build your foundation
          </h2>
          <p className="text-sm text-los-text-secondary">
            Complete all objectives to earn{' '}
            <span className="font-medium text-los-gold">+{FIRST_MISSION_XP} XP</span> and unlock the
            title <span className="font-medium text-los-gold">&ldquo;The Beginner&rdquo;</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-los-border-gold bg-los-gold/10 px-3 py-1.5 text-xs font-medium text-los-gold">
          <StarIcon size={14} />
          {completedCount}/{OBJECTIVES.length} complete
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-los-bg-secondary">
        <div
          className="h-full rounded-full bg-los-gold transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {OBJECTIVES.map((objective) => {
          const done = objectives[objective.key]
          return (
            <li
              key={objective.key}
              className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-all sm:flex-row sm:items-center sm:justify-between ${
                done
                  ? 'border-los-success/30 bg-los-success/5'
                  : 'border-los-border bg-los-bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? 'bg-los-success text-white'
                      : 'border border-los-border text-los-text-muted'
                  }`}
                  aria-hidden
                >
                  {done ? '✓' : '·'}
                </span>
                <span
                  className={`text-sm font-medium ${
                    done ? 'text-los-text-secondary line-through' : 'text-los-text-primary'
                  }`}
                >
                  {objective.label}
                </span>
              </div>
              {!done && (
                <Link
                  href={objective.href}
                  className="text-sm font-medium text-los-gold transition-colors hover:text-los-gold-light"
                >
                  {objective.cta} →
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
