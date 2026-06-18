import type { HealthEntry } from '@/lib/types'

const STORAGE_KEY = 'life_os_health'

export function getHealthEntries(): HealthEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as HealthEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: HealthEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getHealthEntryByDate(date: string): HealthEntry | undefined {
  return getHealthEntries().find((e) => e.date === date)
}

export function saveHealthEntry(entry: HealthEntry): HealthEntry[] {
  const entries = getHealthEntries()
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  saveEntries(entries)
  return getHealthEntries()
}

export function deleteHealthEntry(id: string): HealthEntry[] {
  saveEntries(getHealthEntries().filter((e) => e.id !== id))
  return getHealthEntries()
}
