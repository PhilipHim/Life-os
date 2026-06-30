const STORAGE_KEY = 'life_os_title_unlocks'

export type TitleUnlocks = Record<string, number>

export function getTitleUnlocks(): TitleUnlocks {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as TitleUnlocks
  } catch {
    return {}
  }
}

export function syncTitleUnlocks(newlyUnlocked: { id: string; timestamp: number }[]): TitleUnlocks {
  let unlocks = getTitleUnlocks()
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

export function unlockTitleById(id: string, timestamp = Date.now()): TitleUnlocks {
  return syncTitleUnlocks([{ id, timestamp }])
}
