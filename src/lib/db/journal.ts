import type { JournalEntry } from '@/lib/types'

const STORAGE_KEY = 'life_os_journal'

export function getJournalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as JournalEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: JournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getJournalEntryByDate(date: string): JournalEntry | undefined {
  return getJournalEntries().find((e) => e.date === date)
}

export function getJournalEntry(id: string): JournalEntry | undefined {
  return getJournalEntries().find((e) => e.id === id)
}

export function saveJournalEntry(entry: JournalEntry): JournalEntry[] {
  const entries = getJournalEntries()
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  saveEntries(entries)
  return getJournalEntries()
}

export function deleteJournalEntry(id: string): JournalEntry[] {
  saveEntries(getJournalEntries().filter((e) => e.id !== id))
  return getJournalEntries()
}
