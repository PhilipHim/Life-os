import { tryAwardXp } from '@/lib/xp/state'
import type { ChallengeInstance, ChallengeState, GenerationContext } from '@/lib/challenges/types'
import {
  buildProgressContext,
  dateStr,
  weekKeyFromDate,
  estimateAvgDailyTasks,
  estimateWeeklyTaskPace,
} from '@/lib/challenges/progress'
import { getHabits } from '@/database/habits'
import { getSleepEntries } from '@/database/sleep'
import { getAllSessions } from '@/lib/focus'
import { getHealthEntries } from '@/database/health'
import { generateDailyChallenges, generateWeeklyChallenges, getTemplateById } from '@/lib/challenges/generate'
import {
  loadChallengeStorage,
  saveChallengeStorage,
  emitChallengesUpdated,
} from '@/lib/challenges/storage'

function buildGenerationContext(recentTemplateIds: string[]): GenerationContext {
  const today = dateStr()
  const progressCtx = buildProgressContext()
  return {
    today,
    weekDates: progressCtx.weekDates,
    activeHabitCount: getHabits().filter((h) => h.status === 'active').length,
    avgDailyTasks: estimateAvgDailyTasks(),
    avgWeeklyTasks: estimateWeeklyTaskPace(),
    hasSleepHistory: getSleepEntries().length > 0,
    hasHealthHistory: getHealthEntries().length > 0,
    hasFocusHistory: getAllSessions().some((s) => s.duration > 0),
    recentTemplateIds,
  }
}

function awardChallengeXp(instance: ChallengeInstance): void {
  const key = `challenge:${instance.period}:${instance.periodKey}:${instance.templateId}`
  tryAwardXp(key, instance.xpReward, 'challenge', instance.periodKey, instance.title)
}

function updateInstanceProgress(
  instance: ChallengeInstance,
  progressCtx: ReturnType<typeof buildProgressContext>
): ChallengeInstance {
  const template = getTemplateById(instance.templateId)
  if (!template) return instance

  const current = Math.min(
    template.computeCurrent(instance.target, instance.meta, progressCtx),
    instance.target
  )
  const progress = instance.target > 0 ? Math.round((current / instance.target) * 100) : 0
  const wasComplete = instance.completed
  const isComplete = current >= instance.target

  const updated: ChallengeInstance = {
    ...instance,
    current,
    progress,
    completed: wasComplete || isComplete,
    completedAt: wasComplete ? instance.completedAt : isComplete ? Date.now() : null,
  }

  if (!wasComplete && isComplete) {
    awardChallengeXp(updated)
  }

  return updated
}

function summarize(instances: ChallengeInstance[]) {
  const completed = instances.filter((c) => c.completed).length
  const xpAvailable = instances.reduce((sum, c) => sum + c.xpReward, 0)
  const xpEarned = instances.filter((c) => c.completed).reduce((sum, c) => sum + c.xpReward, 0)
  return { completed, xpAvailable, xpEarned }
}

export function syncChallenges(reference = new Date()): ChallengeState {
  if (typeof window === 'undefined') {
    return emptyState()
  }

  const today = dateStr(reference)
  const weekKey = weekKeyFromDate(reference)
  const progressCtx = buildProgressContext(reference)
  const storage = loadChallengeStorage()
  const ctx = buildGenerationContext(storage.recentTemplateIds)

  let daily = storage.daily
  let weekly = storage.weekly
  let recentTemplateIds = [...storage.recentTemplateIds]

  if (storage.dailyPeriodKey !== today) {
    daily = generateDailyChallenges(today, ctx)
    recentTemplateIds.push(...daily.map((d) => d.templateId))
  }

  if (storage.weeklyPeriodKey !== weekKey) {
    weekly = generateWeeklyChallenges(weekKey, ctx)
    recentTemplateIds.push(...weekly.map((w) => w.templateId))
  }

  recentTemplateIds = recentTemplateIds.slice(-14)

  const prevDailyJson = JSON.stringify(storage.daily)
  const prevWeeklyJson = JSON.stringify(storage.weekly)

  daily = daily.map((d) => updateInstanceProgress(d, progressCtx))
  weekly = weekly.map((w) => updateInstanceProgress(w, progressCtx))

  const nextStorage = {
    dailyPeriodKey: today,
    weeklyPeriodKey: weekKey,
    daily,
    weekly,
    recentTemplateIds,
  }

  const changed =
    prevDailyJson !== JSON.stringify(daily) ||
    prevWeeklyJson !== JSON.stringify(weekly) ||
    storage.dailyPeriodKey !== today ||
    storage.weeklyPeriodKey !== weekKey

  if (changed) {
    saveChallengeStorage(nextStorage)
    emitChallengesUpdated()
  }

  const dailySummary = summarize(daily)
  const weeklySummary = summarize(weekly)

  return {
    daily,
    weekly,
    dailyCompleted: dailySummary.completed,
    weeklyCompleted: weeklySummary.completed,
    dailyXpAvailable: dailySummary.xpAvailable,
    dailyXpEarned: dailySummary.xpEarned,
    weeklyXpAvailable: weeklySummary.xpAvailable,
    weeklyXpEarned: weeklySummary.xpEarned,
  }
}

function emptyState(): ChallengeState {
  return {
    daily: [],
    weekly: [],
    dailyCompleted: 0,
    weeklyCompleted: 0,
    dailyXpAvailable: 0,
    dailyXpEarned: 0,
    weeklyXpAvailable: 0,
    weeklyXpEarned: 0,
  }
}

export function getChallengeState(reference = new Date()): ChallengeState {
  return syncChallenges(reference)
}
