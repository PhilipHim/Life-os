import type { HealthEvent } from '@/lib/types'

const STORAGE_KEY = 'life_os_health_events'

export function getHealthEvents(): HealthEvent[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as HealthEvent[]
  } catch {
    return []
  }
}

function saveEvents(events: HealthEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function saveHealthEvent(event: HealthEvent): HealthEvent[] {
  const events = getHealthEvents()
  const idx = events.findIndex((e) => e.id === event.id)
  if (idx >= 0) {
    events[idx] = event
  } else {
    events.push(event)
  }
  saveEvents(events)
  return getHealthEvents()
}

export function deleteHealthEvent(id: string): HealthEvent[] {
  saveEvents(getHealthEvents().filter((e) => e.id !== id))
  return getHealthEvents()
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00')
  const db = new Date(b + 'T12:00:00')
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}

export function computeHealthStatus(events: HealthEvent[], todayStr: string): {
  status: 'healthy' | 'sick'
  streakDays: number
  lastSickDate: string | null
  eventCount: number
} {
  if (events.length === 0) {
    return { status: 'healthy', streakDays: 0, lastSickDate: null, eventCount: 0 }
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]

  const sickDates = events
    .filter((e) => e.type === 'sick')
    .map((e) => e.date)
    .sort()

  const lastSickDate = sickDates.length > 0 ? sickDates[sickDates.length - 1] : null

  if (latest.type === 'sick') {
    return { status: 'sick', streakDays: 0, lastSickDate, eventCount: events.length }
  }

  const recoveredDates = events
    .filter((e) => e.type === 'recovered')
    .map((e) => e.date)
    .sort()

  const lastRecovered = recoveredDates[recoveredDates.length - 1]

  const sickAfterRecovery = sickDates.some((sd) => sd > lastRecovered)
  if (sickAfterRecovery) {
    return { status: 'sick', streakDays: 0, lastSickDate, eventCount: events.length }
  }

  const streakDays = Math.max(0, daysBetween(lastRecovered, todayStr))

  return { status: 'healthy', streakDays, lastSickDate, eventCount: events.length }
}
