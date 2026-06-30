import type { HabitEntry } from '@/types'
import { awardHabitIfSuccessful } from '@/lib/xp/award'

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
    const result = updateEntry({ ...existing, value, completed })
    awardHabitIfSuccessful(habitId, date)
    return result
  }
  const result = addEntry({
    id: crypto.randomUUID(),
    habitId,
    date,
    value,
    completed,
  })
  awardHabitIfSuccessful(habitId, date)
  return result
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
  const entry = getEntries().find((e) => e.id === id)
  const result = saveAndReturn(getEntries().filter((e) => e.id !== id))
  if (entry) {
    awardHabitIfSuccessful(entry.habitId, entry.date)
  }
  return result
}

function saveAndReturn(entries: HabitEntry[]): HabitEntry[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return getEntries()
}
