import { getDailyStats } from '@/lib/analytics'
import { computeLifeScore } from '@/lib/life-score'
import { getWorkItems } from '@/database/work-items'
import { getTasks } from '@/database/tasks'
import { getHabits } from '@/database/habits'
import { getEntries as getHabitEntries } from '@/database/habit-entries'
import { getJournalEntries } from '@/database/journal'
import { getHealthEvents, computeHealthStatus, daysBetween } from '@/database/health-illness'
import { getAllSessions } from '@/lib/focus'
import { getRoutineTemplates } from '@/database/routine-templates'
import type { ProfileStats } from '@/lib/profile/types'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr(): string {
  return dateStr(new Date())
}

function streakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 0
  const cursor = new Date()
  for (let i = 0; i < 365; i++) {
    const ds = dateStr(cursor)
    if (sorted.includes(ds)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    } else {
      break
    }
  }
  return streak
}

function isHabitSuccess(habitId: string, kind: 'build' | 'avoid', date: string): boolean {
  const entry = getHabitEntries().find((e) => e.habitId === habitId && e.date === date)
  if (kind === 'build') return entry?.completed ?? false
  return !entry
}

function computeLongestHabitStreakForHabit(habitId: string, kind: 'build' | 'avoid'): number {
  let longest = 0
  let current = 0
  for (let i = 365; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (isHabitSuccess(habitId, kind, dateStr(d))) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}

function computeFocusStreak(): number {
  const sessionDates = new Set(getAllSessions().map((s) => s.date))
  const d = new Date()
  const today = todayStr()
  if (!sessionDates.has(today)) {
    d.setDate(d.getDate() - 1)
  }
  let streak = 0
  while (true) {
    const ds = dateStr(d)
    if (sessionDates.has(ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

function countTasksCompleted(): number {
  const legacyTasks = getTasks().filter((t) => t.completed).length
  const workItems = getWorkItems().filter(
    (i) => i.type === 'single' && i.status === 'completed'
  ).length
  return legacyTasks + workItems
}

function countHabitSuccesses(): number {
  const habits = getHabits().filter((h) => h.status === 'active')
  const entries = getHabitEntries()
  const dates = [...new Set(entries.map((e) => e.date))]
  let count = 0
  for (const date of dates) {
    for (const habit of habits) {
      if (isHabitSuccess(habit.id, habit.kind, date)) count++
    }
  }
  return count
}

function computeLongestWellnessStreak(events: ReturnType<typeof getHealthEvents>, today: string): number {
  const current = computeHealthStatus(events, today)
  if (events.length === 0) return 0

  let longest = current.status === 'healthy' ? current.streakDays : 0

  const recoveredDates = events
    .filter((e) => e.type === 'recovered')
    .map((e) => e.date)
    .sort()
  const sickDates = events
    .filter((e) => e.type === 'sick')
    .map((e) => e.date)
    .sort()

  for (const recovered of recoveredDates) {
    const nextSick = sickDates.find((date) => date > recovered)
    const streak = nextSick
      ? Math.max(0, daysBetween(recovered, nextSick) - 1)
      : Math.max(0, daysBetween(recovered, today))
    longest = Math.max(longest, streak)
  }

  return longest
}

function computeLongestHabitStreak(): { streak: number; name: string | null } {
  const habits = getHabits().filter((h) => h.status === 'active')
  let best: { streak: number; name: string } | null = null
  for (const h of habits) {
    const streak = computeLongestHabitStreakForHabit(h.id, h.kind)
    if (!best || streak > best.streak) best = { streak, name: h.title }
  }
  return best ?? { streak: 0, name: null }
}

function avgLifeScore30d(): number | null {
  const values: number[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const result = computeLifeScore(d)
    if (result.total > 0 || result.health != null) values.push(result.total)
  }
  if (values.length === 0) return null
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
}

function avgProductivityScore30d(): number | null {
  const values: number[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const stats = getDailyStats(d)
    if (stats.score > 0) values.push(stats.score)
  }
  if (values.length === 0) return null
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
}

function computeFocusStats(): { sessions: number; minutes: number } {
  const sessions = getAllSessions().filter((s) => s.duration > 0)
  return {
    sessions: sessions.length,
    minutes: Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60000),
  }
}

export function computeProfileStats(): ProfileStats {
  const habitEntries = getHabitEntries()
  const journalEntries = getJournalEntries()
  const healthEvents = getHealthEvents()
  const today = todayStr()
  const healthStatus = computeHealthStatus(healthEvents, today)
  const longestHabit = computeLongestHabitStreak()
  const longestWellnessStreak = computeLongestWellnessStreak(healthEvents, today)
  const focusStats = computeFocusStats()

  return {
    tasksCompleted: countTasksCompleted(),
    habitsCompleted: countHabitSuccesses(),
    journalEntries: journalEntries.length,
    daysWithoutSickness: healthStatus.status === 'healthy' ? healthStatus.streakDays : 0,
    longestWellnessStreak,
    focusSessions: focusStats.sessions,
    focusMinutes: focusStats.minutes,
    routinesCreated: getRoutineTemplates().length,
    currentStreaks: {
      habit: streakFromDates([...new Set(habitEntries.map((e) => e.date))]),
      journal: streakFromDates([...new Set(journalEntries.map((j) => j.date))]),
      focus: computeFocusStreak(),
    },
    longestHabitStreak: longestHabit.streak,
    longestHabitName: longestHabit.name,
    lifeScoreAverage: avgLifeScore30d(),
    productivityScoreAverage: avgProductivityScore30d(),
  }
}
