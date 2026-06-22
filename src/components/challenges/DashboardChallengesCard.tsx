'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import { getChallengeState } from '@/lib/challenges'
import type { ChallengeState } from '@/lib/challenges/types'
import { MountainIcon, StarIcon } from '@/design-system/icons'

export default function DashboardChallengesCard() {
  const [challenges, setChallenges] = useState<ChallengeState | null>(null)

  useEffect(() => {
    const refresh = () => setChallenges(getChallengeState())
    refresh()

    window.addEventListener('xp-updated', refresh)
    window.addEventListener('challenges-updated', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('xp-updated', refresh)
      window.removeEventListener('challenges-updated', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  if (!challenges || challenges.daily.length === 0) return null

  const earned = challenges.dailyXpEarned
  const available = challenges.dailyXpAvailable

  return (
    <Card variant="gold" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MountainIcon size={14} className="text-los-gold" />
            <p className="los-section-label">Today&apos;s Challenges</p>
          </div>
          <p className="mt-2 text-sm text-los-text-secondary">
            {challenges.dailyCompleted} of {challenges.daily.length} complete
            <span className="text-los-text-muted"> · </span>
            <span className="inline-flex items-center gap-1 tabular-nums font-semibold text-los-gold">
              <StarIcon size={12} />
              +{earned}/{available} XP
            </span>
          </p>
        </div>
        <Link
          href="/profile"
          className="text-xs text-los-gold hover:text-los-gold-light transition-colors shrink-0"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-2">
        {challenges.daily.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} compact />
        ))}
      </div>
    </Card>
  )
}
