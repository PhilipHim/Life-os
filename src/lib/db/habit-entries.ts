import type { HabitEntry } from '@/lib/types'

const STORAGE_KEY = 'productivity_habit_entries'

export function getEntries(): HabitEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as HabitEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: HabitEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getEntriesByDate(date: string): HabitEntry[] {
  return getEntries().filter((e) => e.date === date)
}

export function getEntry(habitId: string, date: string): HabitEntry | undefined {
  return getEntries().find((e) => e.habitId === habitId && e.date === date)
}

export function setEntry(habitId: string, date: string, value: number, completed: boolean): HabitEntry[] {
  const entries = getEntries()
  const existing = entries.find((e) => e.habitId === habitId && e.date === date)
  if (existing) {
    return updateEntry({ ...existing, value, completed })
  }
  return addEntry({
    id: crypto.randomUUID(),
    habitId,
    date,
    value,
    completed,
  })
}

export function addEntry(entry: HabitEntry): HabitEntry[] {
  const entries = getEntries()
  saveEntries([...entries, entry])
  return getEntries()
}

export function updateEntry(updated: HabitEntry): HabitEntry[] {
  const entries = getEntries()
  saveEntries(entries.map((e) => (e.id === updated.id ? updated : e)))
  return getEntries()
}

export function deleteEntry(id: string): HabitEntry[] {
  saveEntries(getEntries().filter((e) => e.id !== id))
  return getEntries()
}
