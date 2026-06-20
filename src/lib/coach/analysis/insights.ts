import type { CoachContext } from '@/lib/coach/context'
import type { CoachInsight } from '@/lib/coach/types'

let insightCounter = 0

function insight(category: CoachInsight['category'], message: string): CoachInsight {
  insightCounter += 1
  return { id: `insight-${insightCounter}`, category, message }
}

export function generateInsights(ctx: CoachContext): CoachInsight[] {
  insightCounter = 0
  const results: CoachInsight[] = []

  const { sleepTaskCorrelation, plannerProductivityCorrelation } = ctx.correlations

  if (sleepTaskCorrelation != null && sleepTaskCorrelation >= 0.3) {
    results.push(insight(
      'sleep',
      'You complete more tasks on days with better sleep.'
    ))
  } else if (sleepTaskCorrelation != null && sleepTaskCorrelation <= -0.2) {
    results.push(insight(
      'sleep',
      'Task output drops noticeably when sleep scores fall below 65.'
    ))
  }

  if (plannerProductivityCorrelation != null && plannerProductivityCorrelation >= 0.4) {
    results.push(insight(
      'planner',
      'Planner completion is strongly correlated with productivity.'
    ))
  }

  if (ctx.healthTrendSeries.length >= 3) {
    const healthImproving = ctx.healthTrendSeries[ctx.healthTrendSeries.length - 1] >
      ctx.healthTrendSeries[0]
    if (healthImproving && ctx.lifeScore && ctx.lifeScore.total >= 60) {
      results.push(insight(
        'health',
        'Health improvements have increased Life Score consistency.'
      ))
    }
  }

  if (ctx.weeklyReport && ctx.weeklyReport.focusTrend >= 15) {
    results.push(insight(
      'productivity',
      'Focus sessions are increasing — deep work is becoming a habit.'
    ))
  }

  if (ctx.productivityScore.total >= 75 && ctx.sleepTrendDirection === 'declining') {
    results.push(insight(
      'productivity',
      'High output is masking declining recovery — productivity gains may not be sustainable.'
    ))
  }

  return results.slice(0, 3)
}
