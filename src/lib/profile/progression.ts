import type { ProfileStats, ProfileProgress, Achievement } from '@/lib/profile/types'
import { computeLevelFromXp, computeLevelProgress } from '@/lib/xp/levels'

export function computeProgress(totalXp: number, title = ''): ProfileProgress {
  const level = computeLevelFromXp(totalXp)
  return computeLevelProgress(totalXp, title)
}

export { computeLevelFromXp, xpToReachLevel, xpIncrementForLevel } from '@/lib/xp/levels'
