'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import { getChallengeState } from '@/lib/challenges'
import type { ChallengeState } from '@/lib/challenges/types'

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
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Today&apos;s Challenges</p>
          <p className="mt-1 text-sm text-gray-500">
            {challenges.dailyCompleted} of {challenges.daily.length} complete
            <span className="text-gray-400"> · </span>
            <span className="tabular-nums font-medium text-gray-700">
              +{earned}/{available} XP
            </span>
          </p>
        </div>
        <Link href="/profile" className="text-xs text-gray-500 hover:text-gray-900 transition-colors shrink-0">
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
