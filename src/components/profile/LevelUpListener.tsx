'use client'

import { useEffect, useState } from 'react'
import { getTotalXp } from '@/lib/xp'
import { computeProgress } from '@/lib/profile/progression'

const LEVEL_KEY = 'life_os_last_known_level'
const INIT_KEY = 'life_os_level_initialized'

function LevelUpModal({ level, onDismiss }: { level: number; onDismiss: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]" onClick={onDismiss} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center animate-fade-in"
          role="dialog"
          aria-labelledby="level-up-title"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Level Up</p>
          <h2 id="level-up-title" className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            You reached Level {level}
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Consistent progress compounds. Keep building momentum.
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </>
  )
}

export default function LevelUpListener() {
  const [celebrationLevel, setCelebrationLevel] = useState<number | null>(null)

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
        setCelebrationLevel(progress.level)
      }

      localStorage.setItem(LEVEL_KEY, String(progress.level))
    }

    syncLevel(false)

    const onXpUpdated = () => syncLevel(true)
    window.addEventListener('xp-updated', onXpUpdated)
    return () => window.removeEventListener('xp-updated', onXpUpdated)
  }, [])

  if (celebrationLevel == null) return null

  return (
    <LevelUpModal
      level={celebrationLevel}
      onDismiss={() => setCelebrationLevel(null)}
    />
  )
}
