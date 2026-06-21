const STORAGE_KEY = 'life_os_achievement_unlocks'

export type AchievementUnlocks = Record<string, number>

export function getAchievementUnlocks(): AchievementUnlocks {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AchievementUnlocks
  } catch {
    return {}
  }
}

export function saveAchievementUnlock(id: string, timestamp: number): AchievementUnlocks {
  const unlocks = getAchievementUnlocks()
  if (unlocks[id] != null) return unlocks
  const next = { ...unlocks, [id]: timestamp }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function syncAchievementUnlocks(
  newlyUnlocked: { id: string; timestamp: number }[]
): AchievementUnlocks {
  let unlocks = getAchievementUnlocks()
  let changed = false
  for (const { id, timestamp } of newlyUnlocked) {
    if (unlocks[id] == null) {
      unlocks = { ...unlocks, [id]: timestamp }
      changed = true
    }
  }
  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks))
  }
  return unlocks
}
