'use client'

import { useEffect, useState } from 'react'
import { getTotalXp } from '@/lib/xp'
import { computeProgress } from '@/lib/profile/progression'
import Button from '@/components/ui/Button'
import { CrownIcon, StarIcon } from '@/design-system/icons'

const LEVEL_KEY = 'life_os_last_known_level'
const INIT_KEY = 'life_os_level_initialized'

function LevelUpModal({
  level,
  title,
  onDismiss,
}: {
  level: number
  title: string
  onDismiss: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onDismiss} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
        <div className="los-level-up-modal" role="dialog" aria-labelledby="level-up-title">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center">
            <div className="los-level-emblem" style={{ width: '5rem', height: '5rem' }}>
              <span className="los-level-emblem-ring" />
              <span className="font-heading text-3xl font-bold tabular-nums text-los-gold">{level}</span>
            </div>
          </div>

          <p className="los-section-label mb-2">Level Up</p>
          <h2 id="level-up-title" className="font-heading text-2xl font-bold tracking-wide text-los-text-primary">
            Level {level}
          </h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <CrownIcon size={16} className="text-los-gold" />
            <p className="font-heading text-lg font-medium text-los-gold">{title}</p>
          </div>
          <p className="mt-4 text-sm text-los-text-secondary leading-relaxed">
            Consistent progress compounds. Keep building momentum.
          </p>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-los-text-muted">
            <StarIcon size={12} className="text-los-gold" />
            <span>New title unlocked</span>
          </div>

          <Button variant="gold" className="mt-8 w-full" onClick={onDismiss}>
            Continue
          </Button>
        </div>
      </div>
    </>
  )
}

export default function LevelUpListener() {
  const [celebration, setCelebration] = useState<{ level: number; title: string } | null>(null)

  useEffect(() => {
    function syncLevel(showCelebration: boolean) {
      const progress = computeProgress(getTotalXp())
      const initialized = localStorage.getItem(INIT_KEY) === 'true'
      const last = parseInt(localStorage.getItem(LEVEL_KEY) ?? '1', 10)

      if (!initialized) {
        localStorage.setItem(LEVEL_KEY, String(progress.level))
        localStorage.setItem(INIT_KEY, 'true')
        return
      }

      if (showCelebration && progress.level > last) {
        setCelebration({ level: progress.level, title: progress.title })
      }

      localStorage.setItem(LEVEL_KEY, String(progress.level))
    }

    syncLevel(false)

    const onXpUpdated = () => syncLevel(true)
    window.addEventListener('xp-updated', onXpUpdated)
    return () => window.removeEventListener('xp-updated', onXpUpdated)
  }, [])

  if (celebration == null) return null

  return (
    <LevelUpModal
      level={celebration.level}
      title={celebration.title}
      onDismiss={() => setCelebration(null)}
    />
  )
}
