import { getWorkItems } from '@/database/work-items'
import { getSessions } from '@/lib/focus'
import { getHabits } from '@/database/habits'
import { getEntries } from '@/database/habit-entries'

interface Insight {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
}

function dateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(dateStr(d))
  }
  return days
}

export function getInsights(): Insight[] {
  if (typeof window === 'undefined') return []

  const insights: Insight[] = []

  // ── Work item insights ──
  const items = getWorkItems()
  const singles = items.filter((i) => i.type === 'single' && i.status !== 'deleted')
  const activeSingles = singles.filter((i) => i.status === 'active')
  const totalSingles = singles.length

  if (activeSingles.length > 15) {
    insights.push({
      type: 'negative',
      title: 'Work Overload',
      description: `You have ${activeSingles.length} active items. Try to focus on completing existing ones before adding more.`,
    })
  } else if (activeSingles.length <= 3 && totalSingles > 0) {
    insights.push({
      type: 'positive',
      title: 'Lean Work List',
      description: `Only ${activeSingles.length} active items — a focused workload.`,
    })
  }

  // ── Focus insights ──
  const sessions = getSessions()
  const last7Days = getLast7Days()
  const dailyFocusMinutes = last7Days.map((day) => {
    const dayStart = new Date(day + 'T00:00:00').getTime()
    const dayEnd = dayStart + 86400000
    const daySessions = sessions.filter((s) => s.startTime >= dayStart && s.startTime < dayEnd)
    return daySessions.reduce((sum, s) => sum + s.duration, 0) / 60000
  })
  const avgDailyFocus = dailyFocusMinutes.reduce((a, b) => a + b, 0) / dailyFocusMinutes.length

  if (avgDailyFocus === 0 && totalSingles > 0) {
    insights.push({
      type: 'negative',
      title: 'No Deep Work',
      description: 'No focus sessions recorded in the last 7 days. Try a 25-minute session to build momentum.',
    })
  } else if (avgDailyFocus > 0 && avgDailyFocus < 30) {
    insights.push({
      type: 'neutral',
      title: 'Low Focus Time',
      description: `Averaging ${Math.round(avgDailyFocus)} min/day of deep work. Aim for 60+ minutes per day.`,
    })
  } else if (avgDailyFocus >= 90) {
    insights.push({
      type: 'positive',
      title: 'Strong Deep Work',
      description: `Averaging ${Math.round(avgDailyFocus)} min/day of focus. Great consistency!`,
    })
  }

  const focusDays = dailyFocusMinutes.filter((m) => m > 0).length
  if (focusDays <= 3 && avgDailyFocus > 0) {
    insights.push({
      type: 'neutral',
      title: 'Inconsistent Focus',
      description: `Only ${focusDays}/7 days had focus sessions. Try to make deep work a daily habit.`,
    })
  } else if (focusDays >= 5 && avgDailyFocus > 30) {
    insights.push({
      type: 'positive',
      title: 'Consistent Focus',
      description: `Focus sessions on ${focusDays}/7 days — excellent routine.`,
    })
  }

  // ── Habit insights ──
  const habits = getHabits()
  const activeHabits = habits.filter((h) => h.status === 'active')
  const entries = getEntries()

  if (activeHabits.length > 0) {
    const last7DaysEntries = last7Days.map((day) => {
      return activeHabits.map((h) => {
        const entry = entries.find((e) => e.habitId === h.id && e.date === day)
        if (h.kind === 'avoid') return !entry ? 1 : 0
        if (h.type === 'checkbox') return entry?.completed ? 1 : 0
        return entry?.completed ? 1 : 0
      })
    })

    const dailyRates = last7DaysEntries.map((dayEntries) => {
      const done = dayEntries.filter((v) => v === 1).length
      return done / activeHabits.length
    })

    const avgHabitRate = dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length

    if (avgHabitRate >= 0.8) {
      insights.push({
        type: 'positive',
        title: 'Habit Mastery',
        description: `Completed ${Math.round(avgHabitRate * 100)}% of habits on average this week.`,
      })
    } else if (avgHabitRate <= 0.3 && activeHabits.length > 0) {
      insights.push({
        type: 'negative',
        title: 'Habits Need Attention',
        description: `Only ${Math.round(avgHabitRate * 100)}% average habit completion this week.`,
      })
    }

    const variance = dailyRates.length > 1
      ? dailyRates.reduce((sum, rate) => sum + Math.pow(rate - avgHabitRate, 2), 0) / dailyRates.length
      : 0
    if (variance > 0.15 && activeHabits.length > 0) {
      insights.push({
        type: 'neutral',
        title: 'Routine Inconsistency',
        description: 'Habit completion varies significantly day-to-day. Try to build a more consistent routine.',
      })
    }
  }

  // ── General productivity insights ──
  if (totalSingles > 10) {
    const completedSingles = singles.filter((i) => i.status === 'completed').length
    const completionRate = totalSingles > 0 ? Math.round((completedSingles / totalSingles) * 100) : 0
    if (completionRate < 30) {
      insights.push({
        type: 'negative',
        title: 'Planning Overload',
        description: `Only ${completionRate}% of items completed. Try breaking large items into smaller ones.`,
      })
    }
  }

  if (totalSingles > 0) {
    const completedSingles = singles.filter((i) => i.status === 'completed').length
    const completionRate = Math.round((completedSingles / totalSingles) * 100)
    if (completionRate >= 70 && totalSingles > 3) {
      insights.push({
        type: 'positive',
        title: 'High Completion Rate',
        description: `${completionRate}% of all items completed. Keep it up!`,
      })
    }
  }

  // ── Streak insights ──
  if (activeHabits.length > 0) {
    const todayStr = dateStr(new Date())
    const checkStreak = (days: string[]): number => {
      let streak = 0
      for (const day of days) {
        const dayEntries = activeHabits.map((h) => {
          const entry = entries.find((e) => e.habitId === h.id && e.date === day)
          if (h.kind === 'avoid') return !entry
          if (h.type === 'checkbox') return entry?.completed ?? false
          return entry?.completed ?? false
        })
        if (dayEntries.every((v) => v)) streak++
        else break
      }
      return streak
    }

    const streak = checkStreak(last7Days.reverse())
    if (streak >= 5) {
      insights.push({
        type: 'positive',
        title: 'Perfect Week Streak',
        description: `All habits completed for ${streak} consecutive days!`,
      })
    }
  }

  return insights
}
