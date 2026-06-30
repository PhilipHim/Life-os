import type { FocusSession } from '@/types'

const STORAGE_KEY = 'focus_sessions'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

export function getAllSessions(): FocusSession[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as FocusSession[]
  } catch {
    return []
  }
}

function saveSessions(sessions: FocusSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function addSession(session: FocusSession): FocusSession[] {
  const sessions = getAllSessions()
  saveSessions([...sessions, session])
  return getAllSessions()
}

export function updateSession(updated: FocusSession): FocusSession[] {
  const sessions = getAllSessions()
  saveSessions(sessions.map((s) => (s.id === updated.id ? updated : s)))
  return getAllSessions()
}

export function deleteSession(id: string): FocusSession[] {
  saveSessions(getAllSessions().filter((s) => s.id !== id))
  return getAllSessions()
}

export function getSessionsForDate(date: string): FocusSession[] {
  return getAllSessions().filter((s) => s.date === date)
}

export function getSessionsForWeek(weekStart: string): FocusSession[] {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return getAllSessions().filter((s) => {
    const d = new Date(s.date + 'T00:00:00')
    return d >= start && d < end
  })
}

export function getSessionsForWorkItem(workItemId: string): FocusSession[] {
  return getAllSessions().filter((s) => s.workItemId === workItemId)
}

export function getTodayFocusStats(): { totalMs: number; sessionCount: number; longestMs: number } {
  const sessions = getSessionsForDate(today())
  return {
    totalMs: sessions.reduce((sum, s) => sum + s.duration, 0),
    sessionCount: sessions.length,
    longestMs: sessions.reduce((max, s) => Math.max(max, s.duration), 0),
  }
}

export function getWeekFocusStats(): {
  totalMs: number
  avgSessionMs: number
  topWorkItemId: string | null
  topWorkItemMs: number
  sessionCount: number
} {
  const sessions = getSessionsForWeek(getWeekStart())
  const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0)
  const sessionCount = sessions.length
  const avgSessionMs = sessionCount > 0 ? Math.round(totalMs / sessionCount) : 0

  const byWorkItem = new Map<string, number>()
  for (const s of sessions) {
    byWorkItem.set(s.workItemId, (byWorkItem.get(s.workItemId) || 0) + s.duration)
  }
  let topWorkItemId: string | null = null
  let topWorkItemMs = 0
  for (const [id, ms] of byWorkItem) {
    if (ms > topWorkItemMs) {
      topWorkItemMs = ms
      topWorkItemId = id
    }
  }

  return { totalMs, avgSessionMs, topWorkItemId, topWorkItemMs, sessionCount }
}

export function getWorkItemFocusStats(workItemId: string): { totalMs: number; todayMs: number; sessionCount: number } {
  const all = getSessionsForWorkItem(workItemId)
  const todaySessions = all.filter((s) => s.date === today())
  return {
    totalMs: all.reduce((sum, s) => sum + s.duration, 0),
    todayMs: todaySessions.reduce((sum, s) => sum + s.duration, 0),
    sessionCount: all.length,
  }
}

export function getFocusTimeForWorkItem(workItemId: string): number {
  return getSessionsForWorkItem(workItemId).reduce((sum, s) => sum + s.duration, 0)
}

export function formatFocusTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
  }
  return `${m}m ${s}s`
}

export const getSessions = getAllSessions
