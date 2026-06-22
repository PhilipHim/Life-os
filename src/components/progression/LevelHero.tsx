'use client'

import { useState, useEffect } from 'react'
import type { ProfileProgress } from '@/lib/profile/types'
import ProgressBar from '@/components/ui/ProgressBar'
import { CrownIcon, StarIcon } from '@/design-system/icons'

interface LevelHeroProps {
  displayName: string
  onNameChange: (name: string) => void
  progress: ProfileProgress
}

export default function LevelHero({ displayName, onNameChange, progress }: LevelHeroProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(displayName)

  useEffect(() => {
    setDraft(displayName)
  }, [displayName])

  const commitName = () => {
    const trimmed = draft.trim() || 'Explorer'
    onNameChange(trimmed)
    setDraft(trimmed)
    setEditing(false)
  }

  return (
    <div className="los-level-hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-los-gold to-transparent opacity-60" />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="los-level-emblem" aria-label={`Level ${progress.level}`}>
            <span className="los-level-emblem-ring" />
            <span className="font-heading text-4xl font-bold tabular-nums text-los-gold">
              {progress.level}
            </span>
            <span className="los-section-label mt-1 text-[9px]">Level</span>
          </div>

          <div className="space-y-2 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName()
                  if (e.key === 'Escape') {
                    setDraft(displayName)
                    setEditing(false)
                  }
                }}
                className="w-full max-w-sm border-b-2 border-los-gold bg-transparent font-heading text-3xl font-bold tracking-wide text-los-text-primary focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-left font-heading text-3xl font-bold tracking-wide text-los-text-primary transition-colors hover:text-los-gold"
                title="Click to edit name"
              >
                {displayName}
              </button>
            )}

            <div className="flex items-center gap-2">
              <CrownIcon size={16} className="shrink-0 text-los-gold" />
              <p className="font-heading text-lg font-medium tracking-wide text-los-gold">
                {progress.title}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-los-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <StarIcon size={14} className="text-los-gold" />
                <span className="tabular-nums text-los-gold font-semibold">
                  {progress.totalXp.toLocaleString()} XP
                </span>
                <span>earned</span>
              </span>
              <span className="hidden sm:inline text-los-border">·</span>
              <span className="tabular-nums">
                {progress.xpRemaining.toLocaleString()} XP to Level {progress.level + 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="los-section-label">
            Level {progress.level} → {progress.level + 1}
          </p>
          <p className="text-xs font-medium tabular-nums text-los-gold">
            {progress.progressPct}%
          </p>
        </div>
        <ProgressBar value={progress.progressPct} variant="gold" size="lg" />
        <p className="text-xs text-los-text-muted tabular-nums">
          {progress.currentXp.toLocaleString()} / {progress.xpToNextLevel.toLocaleString()} XP this level
        </p>
      </div>
    </div>
  )
}
