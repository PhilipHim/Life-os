import type { ProfileProgress } from '@/lib/profile/types'

/** Cumulative total XP required to reach level N. Level 1 starts at 0 XP. */
const EXACT_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 800,
  6: 1200,
}

/** XP required to advance from level (n - 1) to level n. */
export function xpIncrementForLevel(level: number): number {
  if (level <= 1) return 0
  if (level === 2) return 100
  if (level === 3) return 150
  if (level === 4) return 250
  if (level === 5) return 300
  if (level === 6) return 400
  return 50 * level + 50 * Math.floor(level / 2) - 50
}

export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0
  if (level <= 6) return EXACT_THRESHOLDS[level]

  let total = EXACT_THRESHOLDS[6]
  for (let l = 7; l <= level; l++) {
    total += xpIncrementForLevel(l)
  }
  return total
}

export function computeLevelFromXp(totalXp: number): number {
  let level = 1
  while (xpToReachLevel(level + 1) <= totalXp) {
    level++
  }
  return level
}

export function computeLevelProgress(totalXp: number, title: string): ProfileProgress {
  const level = computeLevelFromXp(totalXp)
  const currentThreshold = xpToReachLevel(level)
  const nextThreshold = xpToReachLevel(level + 1)
  const currentXp = totalXp - currentThreshold
  const xpToNextLevel = nextThreshold - currentThreshold
  const xpRemaining = Math.max(0, xpToNextLevel - currentXp)
  const progressPct =
    xpToNextLevel > 0 ? Math.min(100, Math.round((currentXp / xpToNextLevel) * 100)) : 100

  return {
    totalXp,
    level,
    currentXp,
    xpToNextLevel,
    xpRemaining,
    progressPct,
    title,
  }
}

export function getLevelPreview(maxLevel = 12): { level: number; totalXp: number; increment: number }[] {
  return Array.from({ length: maxLevel }, (_, i) => {
    const level = i + 1
    return {
      level,
      totalXp: xpToReachLevel(level),
      increment: xpIncrementForLevel(level),
    }
  })
}
