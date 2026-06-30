import { getDailyStats } from '@/lib/analytics'
import { computeLifeScore } from '@/lib/life-score'
import { computeHabitScoreForDate } from '@/lib/score'
import { getSleepEntries } from '@/database/sleep'
import { getHealthEntries } from '@/database/health'
import { getHealthEvents } from '@/database/health-illness'
import { getJournalEntries } from '@/database/journal'
import { getWorkItems } from '@/database/work-items'
import { getSessions } from '@/lib/focus'
import { computeHealthScore } from '@/lib/health-score'
import type { DaySnapshot } from '@/lib/life-intelligence/types'
import { dateStr, weekdayName } from '@/lib/life-intelligence/utils'

function isSickOnDate(events: ReturnType<typeof getHealthEvents>, date: string): boolean {
  return events.some((e) => e.type === 'sick' && e.date === date)
}

function hasMeaningfulActivity(
  stats: ReturnType<typeof getDailyStats>,
  sleep: boolean,
  health: boolean,
  journal: boolean,
  habitScore: number
): boolean {
  return (
    stats.score > 0 ||
    stats.focusMinutes > 0 ||
    stats.tasksCompleted > 0 ||
    sleep ||
    health ||
    journal ||
    habitScore > 0
  )
}

export function collectDaySnapshots(lookbackDays = 90): DaySnapshot[] {
  if (typeof window === 'undefined') return []

  const sleepEntries = getSleepEntries()
  const healthEntries = getHealthEntries()
  const journalEntries = getJournalEntries()
  const healthEvents = getHealthEvents()
  const journalDates = new Set(journalEntries.map((j) => j.date))
  const sleepByDate = new Map(sleepEntries.map((e) => [e.date, e.sleepScore]))
  const healthByDate = new Map(
    healthEntries.map((e) => [e.date, computeHealthScore(e).total])
  )
  const workoutDates = new Set(
    healthEntries.filter((e) => (e.workoutMinutes ?? 0) > 0).map((e) => e.date)
  )

  const snapshots: DaySnapshot[] = []

  for (let i = lookbackDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(12, 0, 0, 0)
    const ds = dateStr(d)

    const stats = getDailyStats(d)
    const life = computeLifeScore(d)
    const habitScore = computeHabitScoreForDate(d)
    const sleepScore = sleepByDate.get(ds) ?? null
    const healthScore = healthByDate.get(ds) ?? null
    const journalLogged = journalDates.has(ds)

    if (
      !hasMeaningfulActivity(
        stats,
        sleepScore != null,
        healthScore != null,
        journalLogged,
        habitScore
      )
    ) {
      continue
    }

    snapshots.push({
      date: ds,
      weekday: d.getDay(),
      weekdayName: weekdayName(d),
      productivity: stats.score,
      lifeScore: life.total,
      sleepScore,
      healthScore,
      habitScore,
      journalLogged,
      tasksCompleted: stats.tasksCompleted,
      focusMinutes: stats.focusMinutes,
      focusPct: Math.min(Math.round((stats.focusMinutes / 180) * 100), 100),
      workoutLogged: workoutDates.has(ds),
      sickDay: isSickOnDate(healthEvents, ds),
    })
  }

  return snapshots
}

export function hasAnyLifeData(): boolean {
  if (typeof window === 'undefined') return false
  return (
    getWorkItems().length > 0 ||
    getSessions().length > 0 ||
    getSleepEntries().length > 0 ||
    getHealthEntries().length > 0 ||
    getJournalEntries().length > 0
  )
}
