import type { CoachContext } from '@/lib/coach/context'

export interface CoachAISnapshot {
  today: string
  productivityScore: number
  productivityBreakdown: {
    plannerCompletionPct: number
    plannerCompleted: number
    plannerTotal: number
    focusMinutesToday: number
    habitRateToday: number
    habitDone: number
    habitTotal: number
  }
  lifeScore: {
    total: number
    productivity: number
    health: number | null
    mind: number
    habits: number
  } | null
  sleepScoreToday: number | null
  healthScoreToday: number | null
  sleepTrendSeries: number[]
  healthTrendSeries: number[]
  productivityTrendSeries: number[]
  habitTrendSeries: number[]
  lowSleepStreakDays: number
  lowWaterStreakDays: number
  activeWorkItems: number
  plannerTrend: string
  habitWeeklyRate: number | null
  journalLoggedToday: boolean
  healthStatus: { status: string; streakDays: number }
  characterAreas: { name: string; level: number; updatedRecently: boolean }[]
  weeklyTrends: {
    productivityPct: number | null
    focusPct: number | null
    tasksPct: number | null
    habitsPct: number | null
    sleepVsMonthPct: number | null
    healthVsWeekPct: number | null
  }
  focusCandidates: string[]
}

export function serializeCoachContextForAI(ctx: CoachContext): CoachAISnapshot {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  return {
    today: ctx.today,
    productivityScore: ctx.productivityScore.total,
    productivityBreakdown: {
      plannerCompletionPct: ctx.plannerCompletion,
      plannerCompleted: ctx.plannerCompleted,
      plannerTotal: ctx.plannerTotal,
      focusMinutesToday: ctx.focusMinutesToday,
      habitRateToday: ctx.habitRate,
      habitDone: ctx.habitDone,
      habitTotal: ctx.habitTotal,
    },
    lifeScore: ctx.lifeScore
      ? {
          total: ctx.lifeScore.total,
          productivity: ctx.lifeScore.productivity,
          health: ctx.lifeScore.health,
          mind: ctx.lifeScore.mind,
          habits: ctx.lifeScore.habits,
        }
      : null,
    sleepScoreToday: ctx.sleepScoreToday,
    healthScoreToday: ctx.healthScoreToday,
    sleepTrendSeries: ctx.sleepTrendSeries,
    healthTrendSeries: ctx.healthTrendSeries,
    productivityTrendSeries: ctx.productivityTrendSeries,
    habitTrendSeries: ctx.habitTrendSeries,
    lowSleepStreakDays: ctx.lowSleepStreakDays,
    lowWaterStreakDays: ctx.lowWaterStreakDays,
    activeWorkItems: ctx.activeWorkItems,
    plannerTrend: ctx.plannerTrend,
    habitWeeklyRate: ctx.habitWeeklyRate,
    journalLoggedToday: ctx.journalLoggedToday,
    healthStatus: {
      status: ctx.healthStatus.status,
      streakDays: ctx.healthStatus.streakDays,
    },
    characterAreas: ctx.characterAreas
      .filter((a) => a.status === 'active')
      .map((a) => ({
        name: a.name,
        level: a.level,
        updatedRecently: a.updatedAt >= weekAgo,
      })),
    weeklyTrends: {
      productivityPct: ctx.weeklyReport?.scoreTrend ?? null,
      focusPct: ctx.weeklyReport?.focusTrend ?? null,
      tasksPct: ctx.weeklyReport?.taskTrend ?? null,
      habitsPct: ctx.weeklyReport?.habitTrend ?? null,
      sleepVsMonthPct: ctx.sleepAnalytics.weekVsMonthPct,
      healthVsWeekPct: ctx.healthAnalytics.scoreTrendPct,
    },
    focusCandidates: ctx.todaysFocusCandidates,
  }
}

export const COACH_SYSTEM_PROMPT = `You are an expert Life OS personal advisor — part productivity coach, health coach, and mentor.
Analyze the user's real data snapshot and return actionable coaching in English only.
Be specific to their numbers and trends. No generic motivational quotes. No chat-style responses.
Identify ONE highest-leverage action (biggest lever), not a list of equal tips.
Return ONLY valid JSON matching the requested schema.`

export function buildCoachUserPrompt(snapshot: CoachAISnapshot): string {
  return `Analyze this Life OS data and produce a coaching report.

DATA:
${JSON.stringify(snapshot, null, 2)}

Return JSON with this exact structure:
{
  "biggestLever": {
    "title": "string (e.g. Sleep Recovery, Task Completion)",
    "category": "productivity|health|sleep|habits|character|life|planner|journal",
    "context": "2-3 sentences explaining why this is the bottleneck now",
    "impactAreas": ["Productivity", "Health", "Focus"],
    "todaysAction": "one specific action for today",
    "score": number 1-100
  },
  "priority": {
    "biggestBottleneck": { "label": "string", "category": "same enum", "reason": "string" },
    "biggestOpportunity": { "label": "string", "category": "same enum", "reason": "string" },
    "mostImportantAction": "string"
  },
  "warnings": [
    { "type": "warning", "category": "enum", "message": "concise warning", "priority": number }
  ],
  "insights": [
    { "message": "observation about correlations or patterns", "category": "enum" }
  ],
  "characterCoach": [
    { "name": "trait name from data", "level": number, "recommendation": "specific actionable advice" }
  ],
  "weekly": {
    "summary": "2 sentences on the week",
    "nextWeekFocus": "one sentence focus for next week",
    "bestImprovement": "string or null",
    "weakestArea": "string or null",
    "highlights": ["string"]
  }
}

Rules:
- Max 4 warnings, max 3 insights, max 3 characterCoach items
- Use declining sleep / task backlog / low habits when data supports it
- characterCoach: pick lowest or stale traits from data with concrete weekly actions
- All text in English`
}
