'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { CrownIcon, StarIcon, TrophyIcon } from '@/design-system/icons'
import { FIRST_MISSION_TITLE_ID, FIRST_MISSION_XP } from '@/types/first-experience'

export default function FirstMissionCelebration() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onComplete = () => setVisible(true)
    window.addEventListener('first-mission-completed', onComplete)
    return () => window.removeEventListener('first-mission-completed', onComplete)
  }, [])

  if (!visible) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
        <div
          className="los-first-mission-celebration pointer-events-auto"
          role="dialog"
          aria-labelledby="first-mission-title"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-los-border-gold bg-los-gold/10">
            <TrophyIcon size={32} className="text-los-gold" />
          </div>
          <p className="los-section-label mb-2">First Mission Complete</p>
          <h2 id="first-mission-title" className="font-heading text-2xl font-bold text-los-text-primary">
            Momentum unlocked
          </h2>
          <p className="mt-2 text-sm text-los-text-secondary">
            You&apos;ve taken your first steps across ASCEND. Keep building.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-los-border-gold bg-los-gold/10 px-3 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-los-text-muted">Reward</p>
              <p className="mt-1 text-lg font-bold text-los-gold">+{FIRST_MISSION_XP} XP</p>
            </div>
            <div className="rounded-xl border border-los-border-gold bg-los-gold/10 px-3 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-los-text-muted">Title</p>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <CrownIcon size={16} className="text-los-gold" />
                <p className="text-sm font-semibold text-los-gold">The Beginner</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-los-text-muted">
            <StarIcon size={12} className="text-los-gold" />
            <span>Title equipped automatically</span>
          </div>

          <Button variant="gold" className="mt-6 w-full" onClick={() => setVisible(false)}>
            Continue
          </Button>
        </div>
      </div>
    </>
  )
}
