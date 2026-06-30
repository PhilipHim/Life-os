import { XP_REWARDS, HIGH_PRIORITIES } from '@/lib/xp/constants'
import { tryAwardXp } from '@/lib/xp/state'
import { getTasks } from '@/database/tasks'
import { getWorkItems } from '@/database/work-items'
import { getDailyPlanItems } from '@/database/daily-plan'
import { getHabits } from '@/database/habits'
import { getEntries as getHabitEntries } from '@/database/habit-entries'
import { getJournalEntries } from '@/database/journal'
import { getSleepEntries } from '@/database/sleep'
import { getHealthEntries } from '@/database/health'
import { computeHealthScore } from '@/lib/health-score'

function isHabitSuccessful(habitId: string, kind: 'build' | 'avoid', date: string): boolean {
  const entry = getHabitEntries().find((e) => e.habitId === habitId && e.date === date)
  if (kind === 'build') return entry?.completed ?? false
  return !entry
}

function isHighPriorityWorkItem(workItemId: string): boolean {
  const planItem = getDailyPlanItems().find((p) => p.workItemId === workItemId)
  return planItem != null && HIGH_PRIORITIES.has(planItem.priority)
}

export function backfillXpFromExistingData(): void {
  for (const task of getTasks()) {
    if (!task.completed) continue
    tryAwardXp(`task:legacy:${task.id}`, XP_REWARDS.taskCompleted, 'task', dateFromTimestamp(task.completedAt ?? task.createdAt), task.title)
  }

  for (const item of getWorkItems()) {
    if (item.type !== 'single' || item.status !== 'completed') continue
    const high = isHighPriorityWorkItem(item.id)
    const amount = high ? XP_REWARDS.highPriorityTask : XP_REWARDS.taskCompleted
    const source = high ? 'high_priority_task' : 'task'
    tryAwardXp(`task:work:${item.id}`, amount, source, dateFromTimestamp(item.completedAt ?? item.updatedAt), item.title)
  }

  const habits = getHabits().filter((h) => h.status === 'active')
  const habitDates = [...new Set(getHabitEntries().map((e) => e.date))]
  for (const date of habitDates) {
    for (const habit of habits) {
      if (isHabitSuccessful(habit.id, habit.kind, date)) {
        tryAwardXp(`habit:${habit.id}:${date}`, XP_REWARDS.habitCompleted, 'habit', date, habit.title)
      }
    }
  }

  for (const entry of getJournalEntries()) {
    tryAwardXp(`journal:${entry.date}`, XP_REWARDS.journalEntry, 'journal', entry.date, 'Journal')
  }

  for (const entry of getSleepEntries()) {
    if (entry.sleepScore >= 80) {
      tryAwardXp(`sleep:${entry.date}`, XP_REWARDS.sleepScore80, 'sleep', entry.date, 'Sleep score 80+')
    }
  }

  for (const entry of getHealthEntries()) {
    if ((entry.workoutMinutes ?? 0) > 0) {
      tryAwardXp(`health:workout:${entry.date}`, XP_REWARDS.workoutLogged, 'workout', entry.date, 'Workout logged')
    }
    if (computeHealthScore(entry).total >= 80) {
      tryAwardXp(`health:score:${entry.date}`, XP_REWARDS.healthScore80, 'health', entry.date, 'Health score 80+')
    }
  }
}

function dateFromTimestamp(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
