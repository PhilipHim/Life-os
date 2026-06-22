import type { ChallengeInstance } from '@/lib/challenges/types'

const STORAGE_KEY = 'life_os_challenges'

export interface ChallengeStorage {
  dailyPeriodKey: string
  weeklyPeriodKey: string
  daily: ChallengeInstance[]
  weekly: ChallengeInstance[]
  recentTemplateIds: string[]
}

const EMPTY: ChallengeStorage = {
  dailyPeriodKey: '',
  weeklyPeriodKey: '',
  daily: [],
  weekly: [],
  recentTemplateIds: [],
}

export function loadChallengeStorage(): ChallengeStorage {
  if (typeof window === 'undefined') return { ...EMPTY }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...EMPTY }
  try {
    const parsed = JSON.parse(raw) as ChallengeStorage
    return {
      dailyPeriodKey: parsed.dailyPeriodKey ?? '',
      weeklyPeriodKey: parsed.weeklyPeriodKey ?? '',
      daily: Array.isArray(parsed.daily) ? parsed.daily : [],
      weekly: Array.isArray(parsed.weekly) ? parsed.weekly : [],
      recentTemplateIds: Array.isArray(parsed.recentTemplateIds) ? parsed.recentTemplateIds : [],
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveChallengeStorage(storage: ChallengeStorage): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
}

export function emitChallengesUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('challenges-updated'))
  }
}
