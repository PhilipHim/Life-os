import { getTasks } from '@/lib/db/tasks'
import { getWorkItems } from '@/lib/db/work-items'
import { getHabits } from '@/lib/db/habits'
import { getEntries as getHabitEntries } from '@/lib/db/habit-entries'
import { getJournalEntries } from '@/lib/db/journal'
import { getSleepEntries } from '@/lib/db/sleep'
import { getHealthEntries } from '@/lib/db/health'
import type { ProgressContext } from '@/lib/challenges/types'

function dateFromTimestamp(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isHabitSuccess(habitId: string, kind: 'build' | 'avoid', date: string): boolean {
  const entry = getHabitEntries().find((e) => e.habitId === habitId && e.date === date)
  if (kind === 'build') return entry?.completed ?? false
  return !entry
}

export function countTasksOnDate(date: string): number {
  const legacy = getTasks().filter(
    (t) => t.completed && t.completedAt != null && dateFromTimestamp(t.completedAt) === date
  ).length
  const work = getWorkItems().filter(
    (i) =>
      i.type === 'single' &&
      i.status === 'completed' &&
      i.completedAt != null &&
      dateFromTimestamp(i.completedAt) === date
  ).length
  return legacy + work
}

export function countTasksInWeek(weekDates: string[]): number {
  return weekDates.reduce((sum, date) => sum + countTasksOnDate(date), 0)
}

export function countHabitSuccessesOnDate(date: string): number {
  const habits = getHabits().filter((h) => h.status === 'active')
  return habits.filter((h) => isHabitSuccess(h.id, h.kind, date)).length
}

export function countHabitSuccessesInWeek(weekDates: string[]): number {
  return weekDates.reduce((sum, date) => sum + countHabitSuccessesOnDate(date), 0)
}

export function countJournalOnDate(date: string): number {
  return getJournalEntries().some((e) => e.date === date) ? 1 : 0
}

export function countJournalInWeek(weekDates: string[]): number {
  const dates = new Set(getJournalEntries().map((e) => e.date))
  return weekDates.filter((d) => dates.has(d)).length
}

export function getSleepScoreOnDate(date: string): number | null {
  const entry = getSleepEntries().find((e) => e.date === date)
  return entry?.sleepScore ?? null
}

export function hasSleepLoggedOnDate(date: string): boolean {
  return getSleepEntries().some((e) => e.date === date)
}

export function countSleepDaysAboveScore(weekDates: string[], minScore: number): number {
  return weekDates.filter((date) => {
    const score = getSleepScoreOnDate(date)
    return score != null && score >= minScore
  }).length
}

export function hasHealthLoggedOnDate(date: string): boolean {
  return getHealthEntries().some((e) => e.date === date)
}

export function countWorkoutsInWeek(weekDates: string[]): number {
  return getHealthEntries().filter(
    (e) => weekDates.includes(e.date) && (e.workoutMinutes ?? 0) > 0
  ).length
}

export function estimateAvgDailyTasks(): number {
  let total = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    total += countTasksOnDate(dateStr(d))
  }
  return Math.max(1, Math.round(total / 7))
}

export function estimateWeeklyTaskPace(): number {
  const monday = getMonday(new Date())
  const weekDates = weekDatesFromMonday(monday)
  return Math.max(countTasksInWeek(weekDates), estimateAvgDailyTasks() * 3)
}

export function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(12, 0, 0, 0)
  return monday
}

export function weekDatesFromMonday(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return dateStr(d)
  })
}

export function dateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function weekKeyFromDate(d: Date = new Date()): string {
  return dateStr(getMonday(d))
}

export function buildProgressContext(reference = new Date()): ProgressContext {
  const monday = getMonday(reference)
  return {
    today: dateStr(reference),
    weekDates: weekDatesFromMonday(monday),
  }
}
