import { XP_REWARDS, HIGH_PRIORITIES } from '@/lib/xp/constants'
import { tryAwardXp } from '@/lib/xp/state'
import { getDailyPlanItems } from '@/lib/db/daily-plan'
import { getHabits } from '@/lib/db/habits'
import { getEntries as getHabitEntries } from '@/lib/db/habit-entries'
import { computeHealthScore } from '@/lib/health-score'
import type { HealthEntry, SleepEntry } from '@/lib/types'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isHighPriorityWorkItem(workItemId: string): boolean {
  const planItem = getDailyPlanItems().find((p) => p.workItemId === workItemId)
  return planItem != null && HIGH_PRIORITIES.has(planItem.priority)
}

function isHabitSuccessful(habitId: string, date: string): boolean {
  const habit = getHabits().find((h) => h.id === habitId)
  if (!habit || habit.status !== 'active') return false
  const entry = getHabitEntries().find((e) => e.habitId === habitId && e.date === date)
  if (habit.kind === 'build') return entry?.completed ?? false
  return !entry
}

export function awardLegacyTaskCompleted(taskId: string, title: string, completedAt?: number | null): void {
  const date = completedAt ? dateFromTimestamp(completedAt) : todayStr()
  tryAwardXp(`task:legacy:${taskId}`, XP_REWARDS.taskCompleted, 'task', date, title)
}

export function awardWorkItemCompleted(workItemId: string, title: string, completedAt?: number | null): void {
  const high = isHighPriorityWorkItem(workItemId)
  const amount = high ? XP_REWARDS.highPriorityTask : XP_REWARDS.taskCompleted
  const source = high ? 'high_priority_task' : 'task'
  const date = completedAt ? dateFromTimestamp(completedAt) : todayStr()
  tryAwardXp(`task:work:${workItemId}`, amount, source, date, title)
}

export function awardHabitIfSuccessful(habitId: string, date: string): void {
  const habit = getHabits().find((h) => h.id === habitId)
  if (!habit || !isHabitSuccessful(habitId, date)) return
  tryAwardXp(`habit:${habitId}:${date}`, XP_REWARDS.habitCompleted, 'habit', date, habit.title)
}

export function awardJournalEntry(date: string): void {
  tryAwardXp(`journal:${date}`, XP_REWARDS.journalEntry, 'journal', date, 'Journal entry')
}

export function awardSleepEntry(entry: SleepEntry): void {
  if (entry.sleepScore >= 80) {
    tryAwardXp(`sleep:${entry.date}`, XP_REWARDS.sleepScore80, 'sleep', entry.date, 'Sleep score 80+')
  }
}

export function awardHealthEntry(entry: HealthEntry): void {
  if ((entry.workoutMinutes ?? 0) > 0) {
    tryAwardXp(`health:workout:${entry.date}`, XP_REWARDS.workoutLogged, 'workout', entry.date, 'Workout logged')
  }
  if (computeHealthScore(entry).total >= 80) {
    tryAwardXp(`health:score:${entry.date}`, XP_REWARDS.healthScore80, 'health', entry.date, 'Health score 80+')
  }
}

function dateFromTimestamp(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
