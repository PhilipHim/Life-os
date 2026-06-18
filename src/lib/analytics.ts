import type { WorkItem } from '@/lib/types'
import { getWorkItems } from '@/lib/db/work-items'
import { getSessions } from '@/lib/focus'
import { calculateDailyScore } from '@/lib/score'

export interface DailyAnalytics {
  date: string
  displayDate: string
  score: number
  focusMinutes: number
  tasksCompleted: number
}

function formatDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function singleItemsCompletedOnDate(items: WorkItem[], date: Date): number {
  const target = date.toISOString().split('T')[0]
  return items.filter((i) => i.type === 'single' && i.status === 'completed' && i.completedAt && new Date(i.completedAt).toISOString().split('T')[0] === target).length
}

export function getDailyStats(date: Date): DailyAnalytics {
  const items = getWorkItems()
  const allSessions = getSessions()

  const { score, focusMinutes } = calculateDailyScore(items, allSessions, date)
  const singles = items.filter((i) => i.type === 'single' && i.status !== 'deleted')
  const tasksCompleted = singleItemsCompletedOnDate(singles, date)

  return { date: getDateString(date), displayDate: formatDate(date), score, focusMinutes, tasksCompleted }
}

export function getLast7DaysData(): DailyAnalytics[] {
  const today = new Date()
  const days: DailyAnalytics[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push(getDailyStats(date))
  }

  return days
}

export function aggregateWeek(data: DailyAnalytics[]) {
  return {
    totalFocusMinutes: data.reduce((sum, d) => sum + d.focusMinutes, 0),
    avgScore: Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length),
  }
}
