import type { SleepEntry } from '@/lib/types'
import { awardSleepEntry } from '@/lib/xp/award'

const STORAGE_KEY = 'life_os_sleep'

export function getSleepEntries(): SleepEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SleepEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: SleepEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getSleepEntryByDate(date: string): SleepEntry | undefined {
  return getSleepEntries().find((e) => e.date === date)
}

export function getSleepEntry(id: string): SleepEntry | undefined {
  return getSleepEntries().find((e) => e.id === id)
}

export function saveSleepEntry(entry: SleepEntry): SleepEntry[] {
  const entries = getSleepEntries()
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  saveEntries(entries)
  awardSleepEntry(entry)
  return getSleepEntries()
}

export function deleteSleepEntry(id: string): SleepEntry[] {
  saveEntries(getSleepEntries().filter((e) => e.id !== id))
  return getSleepEntries()
}

export function calculateSleepScore(
  totalMinutes: number,
  remMinutes: number,
  deepMinutes: number,
  awakeMinutes: number
): number {
  let durationScore = 0
  if (totalMinutes >= 420 && totalMinutes <= 540) durationScore = 40
  else if (totalMinutes >= 360 && totalMinutes < 420) durationScore = 30
  else if (totalMinutes > 540 && totalMinutes <= 600) durationScore = 30
  else if (totalMinutes >= 300 && totalMinutes < 360) durationScore = 20
  else if (totalMinutes > 600) durationScore = 15
  else durationScore = 10

  const remPct = totalMinutes > 0 ? (remMinutes / totalMinutes) * 100 : 0
  let remScore = 0
  if (remPct >= 20 && remPct <= 25) remScore = 20
  else if (remPct >= 15 && remPct < 20) remScore = 15
  else if (remPct > 25 && remPct <= 30) remScore = 15
  else if (remPct >= 10 && remPct < 15) remScore = 10
  else remScore = 5

  const deepPct = totalMinutes > 0 ? (deepMinutes / totalMinutes) * 100 : 0
  let deepScore = 0
  if (deepPct >= 15 && deepPct <= 20) deepScore = 20
  else if (deepPct >= 10 && deepPct < 15) deepScore = 15
  else if (deepPct > 20 && deepPct <= 25) deepScore = 15
  else if (deepPct >= 5 && deepPct < 10) deepScore = 10
  else deepScore = 5

  const awakePct = totalMinutes > 0 ? (awakeMinutes / totalMinutes) * 100 : 0
  let awakeScore = 0
  if (awakePct < 5) awakeScore = 20
  else if (awakePct >= 5 && awakePct < 10) awakeScore = 15
  else if (awakePct >= 10 && awakePct < 15) awakeScore = 10
  else awakeScore = 5

  return Math.min(Math.round(durationScore + remScore + deepScore + awakeScore), 100)
}

export function getSleepRating(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Poor'
}
