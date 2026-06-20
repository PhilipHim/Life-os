import type { CoachContext } from '@/lib/coach/context'
import type { CoachMessage } from '@/lib/coach/types'
import { countConsecutiveDecline } from '@/lib/coach/analysis/trends'

let warnCounter = 0

function warning(category: CoachMessage['category'], message: string, priority: number): CoachMessage {
  warnCounter += 1
  return { id: `warn-${warnCounter}`, type: 'warning', category, message, priority }
}

export function generateWarnings(ctx: CoachContext): CoachMessage[] {
  warnCounter = 0
  const warnings: CoachMessage[] = []

  const sleepDeclineDays = countConsecutiveDecline(ctx.sleepTrendSeries)
  if (sleepDeclineDays >= 3) {
    warnings.push(warning(
      'sleep',
      `Sleep has declined for ${sleepDeclineDays} consecutive days.`,
      90 + sleepDeclineDays
    ))
  } else if (ctx.lowSleepStreakDays >= 3) {
    warnings.push(warning(
      'sleep',
      `Sleep score has been below target for ${ctx.lowSleepStreakDays} days.`,
      85
    ))
  }

  if (ctx.healthAnalytics.scoreTrendPct != null && ctx.healthAnalytics.scoreTrendPct <= -15) {
    warnings.push(warning(
      'health',
      `Health score dropped ${Math.abs(ctx.healthAnalytics.scoreTrendPct)}% this week.`,
      82
    ))
  }

  if (ctx.plannerTrend === 'declining') {
    warnings.push(warning('planner', 'Planner completion is falling.', 78))
  }

  if (ctx.habitWeeklyRate != null && ctx.habitWeeklyRate < 60) {
    warnings.push(warning('habits', 'Habit consistency is below target.', 76))
  }

  if (ctx.activeWorkItems >= 12) {
    warnings.push(warning(
      'productivity',
      `Too many unfinished tasks are accumulating (${ctx.activeWorkItems} active).`,
      80
    ))
  }

  if (ctx.healthStatus.status === 'sick') {
    warnings.push(warning('health', 'You are currently marked as sick — reduce workload today.', 95))
  }

  if (ctx.lowWaterStreakDays >= 5) {
    warnings.push(warning(
      'health',
      `Hydration has been below target for ${ctx.lowWaterStreakDays} days.`,
      70
    ))
  }

  return warnings.sort((a, b) => b.priority - a.priority).slice(0, 5)
}
