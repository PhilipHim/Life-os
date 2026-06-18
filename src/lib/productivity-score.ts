import type { DailyPlanItem, WorkItem, FocusSession } from '@/lib/types'

const PRIORITY_WEIGHTS: Record<string, number> = { H1: 4, H2: 3, M: 2, L: 1 }

export interface ProductivityScore {
  total: number
  planner: {
    score: number
    max: number
    completed: number
    total: number
    percentage: number
  }
  priority: {
    score: number
    max: number
    completedWeight: number
    totalWeight: number
    percentage: number
  }
  focus: {
    score: number
    max: number
    totalMinutes: number
    percentage: number
  }
  habits: {
    score: number
    max: number
    completed: number
    total: number
    percentage: number
  }
}

export interface Insight {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeFocusScore(totalMinutes: number): number {
  if (totalMinutes >= 180) return 20
  if (totalMinutes >= 120) return 15 + ((totalMinutes - 120) / 60) * 5
  if (totalMinutes >= 60) return 10 + ((totalMinutes - 60) / 60) * 5
  if (totalMinutes >= 30) return 5 + ((totalMinutes - 30) / 30) * 5
  return (totalMinutes / 30) * 5
}

export function computeProductivityScore(
  planItems: DailyPlanItem[],
  workItems: WorkItem[],
  focusSessions: FocusSession[],
  habitStats: { completed: number; total: number }
): ProductivityScore {
  const today = todayStr()
  const todayPlan = planItems.filter((pi) => pi.date === today)

  const plannerTotal = todayPlan.length
  const plannerCompleted = todayPlan.filter((pi) => {
    const wi = workItems.find((w) => w.id === pi.workItemId)
    return wi?.status === 'completed'
  }).length
  const plannerPercentage = plannerTotal > 0 ? (plannerCompleted / plannerTotal) * 100 : 0
  const plannerScore = plannerTotal > 0 ? Math.round((plannerCompleted / plannerTotal) * 40) : 0

  let completedWeight = 0
  let totalWeight = 0
  for (const pi of todayPlan) {
    const weight = PRIORITY_WEIGHTS[pi.priority] ?? 1
    totalWeight += weight
    const wi = workItems.find((w) => w.id === pi.workItemId)
    if (wi?.status === 'completed') {
      completedWeight += weight
    }
  }
  const priorityPercentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0
  const priorityScore = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 25) : 0

  const todaySessions = focusSessions.filter((s) => s.date === today && s.duration > 0)
  const totalFocusMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60000
  const focusScore = Math.min(Math.round(computeFocusScore(totalFocusMinutes) * 10) / 10, 20)
  const focusPercentage = Math.min((totalFocusMinutes / 180) * 100, 100)

  const habitCompleted = habitStats.completed
  const habitTotal = habitStats.total
  const habitPercentage = habitTotal > 0 ? (habitCompleted / habitTotal) * 100 : 0
  const habitScore = habitTotal > 0 ? Math.round((habitCompleted / habitTotal) * 15) : 0

  const total = Math.min(plannerScore + priorityScore + focusScore + habitScore, 100)

  return {
    total,
    planner: {
      score: plannerScore,
      max: 40,
      completed: plannerCompleted,
      total: plannerTotal,
      percentage: Math.round(plannerPercentage),
    },
    priority: {
      score: priorityScore,
      max: 25,
      completedWeight: Math.round(completedWeight),
      totalWeight,
      percentage: Math.round(priorityPercentage),
    },
    focus: {
      score: focusScore,
      max: 20,
      totalMinutes: Math.round(totalFocusMinutes),
      percentage: Math.round(focusPercentage),
    },
    habits: {
      score: habitScore,
      max: 15,
      completed: habitCompleted,
      total: habitTotal,
      percentage: Math.round(habitPercentage),
    },
  }
}

export function generateProductivityInsights(
  score: ProductivityScore,
  planItems: DailyPlanItem[],
  workItems: WorkItem[]
): Insight[] {
  const insights: Insight[] = []
  const today = todayStr()
  const todayPlan = planItems.filter((pi) => pi.date === today)

  if (todayPlan.length === 0) return insights

  if (score.planner.total > 0) {
    if (score.planner.percentage >= 90) {
      insights.push({
        type: 'positive',
        title: 'Planner Completion',
        description: `Completed ${score.planner.completed}/${score.planner.total} planned tasks. Excellent execution!`,
      })
    } else if (score.planner.percentage >= 70) {
      insights.push({
        type: 'positive',
        title: 'Good Progress',
        description: `Completed ${score.planner.completed}/${score.planner.total} planned tasks.`,
      })
    }
    if (score.planner.completed < score.planner.total) {
      const remaining = score.planner.total - score.planner.completed
      insights.push({
        type: 'negative',
        title: remaining === 1 ? '1 Planned Task Unfinished' : `${remaining} Planned Tasks Unfinished`,
        description: remaining === 1
          ? 'One planned task remains incomplete today.'
          : `${remaining} planned tasks remain incomplete today.`,
      })
    }
  }

  const h1Items = todayPlan.filter((pi) => pi.priority === 'H1')
  const h1Completed = h1Items.filter((pi) =>
    workItems.find((w) => w.id === pi.workItemId)?.status === 'completed'
  ).length

  if (h1Items.length > 0 && h1Completed === h1Items.length) {
    insights.push({
      type: 'positive',
      title: 'All H1 Tasks Done',
      description: 'Every high-priority task was completed today.',
    })
  } else if (h1Items.length > 0 && h1Completed === 0) {
    insights.push({
      type: 'negative',
      title: 'No H1 Completed',
      description: 'No high-priority task was completed today.',
    })
  }

  if (score.priority.percentage >= 80 && score.priority.totalWeight > 0) {
    insights.push({
      type: 'positive',
      title: 'Priority Focus',
      description: 'Weighted priority completion at ' + score.priority.percentage + '%.',
    })
  }

  if (score.focus.totalMinutes >= 120) {
    insights.push({
      type: 'positive',
      title: 'Deep Focus',
      description: score.focus.totalMinutes + ' minutes of focused work — outstanding.',
    })
  } else if (score.focus.totalMinutes >= 60) {
    insights.push({
      type: 'positive',
      title: 'Good Focus Time',
      description: score.focus.totalMinutes + ' minutes of focused work today.',
    })
  } else if (score.focus.totalMinutes > 0 && score.focus.totalMinutes < 30) {
    insights.push({
      type: 'negative',
      title: 'Low Focus',
      description: 'Only ' + score.focus.totalMinutes + ' minutes of focus. Aim for 30+.',
    })
  }

  if (score.habits.total > 0) {
    if (score.habits.percentage >= 80) {
      insights.push({
        type: 'positive',
        title: 'Habit Consistency',
        description: 'Completed ' + score.habits.completed + '/' + score.habits.total + ' habits today.',
      })
    } else if (score.habits.percentage < 50) {
      insights.push({
        type: 'negative',
        title: 'Habits Behind',
        description: 'Only ' + score.habits.completed + '/' + score.habits.total + ' habits completed today.',
      })
    }
  }

  return insights
}
