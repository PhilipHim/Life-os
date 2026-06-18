import type { WorkItem, FocusSession } from '@/lib/types'
import { getWorkItems } from '@/lib/db/work-items'
import { getSessions } from '@/lib/focus'
import { getHabits } from '@/lib/db/habits'
import { getEntries } from '@/lib/db/habit-entries'

export interface DailyScore {
  score: number
  focusMinutes: number
  completionRate: number
}

export interface UnifiedScore {
  total: number
  tasks: number
  focus: number
  habits: number
}

function getDayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function dateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function singleItemsCompletedOnDate(items: WorkItem[], date: Date): number {
  const target = dateStr(date)
  return items.filter((i) => i.type === 'single' && i.status === 'completed' && i.completedAt && dateStr(new Date(i.completedAt)) === target).length
}

export function computeWorkCompletionRate(items: WorkItem[]): number {
  const singles = items.filter((i) => i.type === 'single' && i.status !== 'deleted')
  if (singles.length === 0) return 0
  const done = singles.filter((i) => i.status === 'completed').length
  return done / singles.length
}

export function computeGroupProgress(items: WorkItem[]): number {
  const groups = items.filter((i) => i.type === 'group' && i.status !== 'deleted')
  if (groups.length === 0) return 0
  let total = 0
  for (const g of groups) {
    const children = g.childrenIds.map((cid) => items.find((i) => i.id === cid)).filter(Boolean) as WorkItem[]
    const done = children.filter((c) => c.status === 'completed').length
    total += children.length > 0 ? done / children.length : 0
  }
  return Math.round((total / groups.length) * 100)
}

export function computeAverageGroupProgress(items: WorkItem[]): number {
  const groups = items.filter((i) => i.type === 'group' && i.status !== 'deleted')
  if (groups.length === 0) return 0
  let total = 0
  for (const g of groups) {
    const children = g.childrenIds.map((cid) => items.find((i) => i.id === cid)).filter(Boolean) as WorkItem[]
    const done = children.filter((c) => c.status === 'completed').length
    total += children.length > 0 ? Math.round((done / children.length) * 100) : 0
  }
  return Math.round(total / groups.length)
}

export function calculateDailyScore(items: WorkItem[], sessions: FocusSession[], date?: Date): DailyScore {
  const targetDate = date ?? new Date()
  const singles = items.filter((i) => i.type === 'single' && i.status !== 'deleted')
  const totalSingles = singles.length
  const doneSingles = singleItemsCompletedOnDate(singles, targetDate)
  const completionRate = totalSingles > 0 ? doneSingles / totalSingles : 0

  const dayStart = getDayStart(targetDate)
  const dayEnd = dayStart + 86400000
  const daySessions = sessions.filter((s) => s.startTime >= dayStart && s.startTime < dayEnd)
  const totalFocusMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0) / 60000
  const focusScore = Math.min(totalFocusMinutes / 180, 1)

  const score = Math.round((completionRate * 0.5 + focusScore * 0.5) * 100)

  return { score, focusMinutes: Math.round(totalFocusMinutes), completionRate: Math.round(completionRate * 100) }
}

export function computeHabitScoreForDate(date: Date): number {
  const habits = getHabits()
  const allEntries = getEntries()
  const target = dateStr(date)
  const dayEntries = allEntries.filter((e) => e.date === target)

  const activeHabits = habits.filter((h) => h.status === 'active')
  const buildHabits = activeHabits.filter((h) => h.kind === 'build')
  const avoidHabits = activeHabits.filter((h) => h.kind === 'avoid')
  const timeQuantityHabits = buildHabits.filter((h) => h.type !== 'checkbox')

  const buildTotal = buildHabits.length

  const buildDone = buildHabits.filter((h) => {
    const entry = dayEntries.find((e) => e.habitId === h.id)
    if (h.kind === 'build') {
      if (h.type === 'checkbox') return entry?.completed ?? false
      return entry ? entry.completed : false
    }
    return false
  }).length

  const avoidTotal = avoidHabits.length
  const avoidSuccess = avoidHabits.filter((h) => {
    const entry = dayEntries.find((e) => e.habitId === h.id)
    return !entry
  }).length

  const buildScore = buildTotal > 0 ? (buildDone / buildTotal) * 40 : 0
  const avoidViolations = avoidTotal - avoidSuccess
  const avoidRate = avoidTotal > 0 ? (avoidSuccess - avoidViolations) / avoidTotal : 0
  const avoidScore = Math.max(0, avoidRate) * 40

  let totalProgress = 0
  for (const habit of timeQuantityHabits) {
    const entry = dayEntries.find((e) => e.habitId === habit.id)
    if (entry && habit.targetValue > 0) {
      totalProgress += Math.min(entry.value / habit.targetValue, 1)
    }
  }
  const avgProgress = timeQuantityHabits.length > 0 ? totalProgress / timeQuantityHabits.length : 0
  const progressScore = avgProgress * 20

  return Math.min(Math.round(buildScore + avoidScore + progressScore), 100)
}

export function getUnifiedScore(date?: Date): UnifiedScore {
  const targetDate = date ?? new Date()
  const items = getWorkItems()
  const allSessions = getSessions()

  const workRate = computeWorkCompletionRate(items)

  const dayStart = getDayStart(targetDate)
  const dayEnd = dayStart + 86400000
  const daySessions = allSessions.filter((s) => s.startTime >= dayStart && s.startTime < dayEnd)
  const focusMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0) / 60000
  const focusScore = Math.min(focusMinutes / 180, 1)

  const habitScoreValue = computeHabitScoreForDate(targetDate)

  const tasksWeight = Math.round(workRate * 40)
  const focusWeight = Math.round(focusScore * 30)
  const habitsWeight = Math.round((habitScoreValue / 100) * 30)
  const total = Math.min(tasksWeight + focusWeight + habitsWeight, 100)

  return {
    total,
    tasks: Math.round(workRate * 100),
    focus: Math.round(focusScore * 100),
    habits: habitScoreValue,
  }
}

export function getTodayScore(): DailyScore {
  const items = getWorkItems()
  const allSessions = getSessions()
  return calculateDailyScore(items, allSessions, new Date())
}

export function getTodayUnifiedScore(): UnifiedScore {
  return getUnifiedScore(new Date())
}
