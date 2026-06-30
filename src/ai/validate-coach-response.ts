import type {
  CoachReport,
  DailyCoachReport,
  CoachCategory,
  CoachMessage,
  CoachInsight,
  CharacterCoachItem,
  WeeklyCoachReview,
} from '@/lib/coach/types'
import type { CoachContext } from '@/lib/coach/context'
import { buildTrendMetrics } from '@/lib/coach/analysis/priority'

const CATEGORIES: CoachCategory[] = [
  'productivity', 'health', 'sleep', 'habits', 'character', 'life', 'planner', 'journal', 'business',
]

function asCategory(value: unknown): CoachCategory {
  if (typeof value === 'string' && CATEGORIES.includes(value as CoachCategory)) {
    return value as CoachCategory
  }
  return 'life'
}

let msgId = 0
function makeMessage(raw: Partial<CoachMessage>): CoachMessage {
  msgId += 1
  return {
    id: `ai-${msgId}`,
    type: raw.type === 'warning' ? 'warning' : 'advice',
    category: asCategory(raw.category),
    message: String(raw.message ?? ''),
    priority: typeof raw.priority === 'number' ? raw.priority : 50,
    title: raw.title,
  }
}

interface RawCoachAIResponse {
  biggestLever?: Partial<DailyCoachReport['biggestLever']>
  priority?: Partial<DailyCoachReport['priority']>
  warnings?: Partial<CoachMessage>[]
  insights?: Partial<CoachInsight>[]
  characterCoach?: Partial<CharacterCoachItem>[]
  weekly?: Partial<WeeklyCoachReview>
}

export function mergeAICoachReport(
  raw: RawCoachAIResponse,
  ctx: CoachContext,
  fallback: CoachReport
): CoachReport {
  msgId = 0
  const trends = buildTrendMetrics(ctx)
  const lever = raw.biggestLever ?? fallback.daily.biggestLever

  const daily: DailyCoachReport = {
    biggestLever: {
      title: String(lever.title ?? fallback.daily.biggestLever.title),
      category: asCategory(lever.category),
      context: String(lever.context ?? fallback.daily.biggestLever.context),
      impactAreas: Array.isArray(lever.impactAreas)
        ? lever.impactAreas.map(String).slice(0, 5)
        : fallback.daily.biggestLever.impactAreas,
      todaysAction: String(lever.todaysAction ?? fallback.daily.biggestLever.todaysAction),
      score: typeof lever.score === 'number' ? lever.score : fallback.daily.biggestLever.score,
    },
    priority: {
      biggestBottleneck: {
        label: String(raw.priority?.biggestBottleneck?.label ?? fallback.daily.priority.biggestBottleneck.label),
        category: asCategory(raw.priority?.biggestBottleneck?.category),
        reason: String(raw.priority?.biggestBottleneck?.reason ?? fallback.daily.priority.biggestBottleneck.reason),
      },
      biggestOpportunity: {
        label: String(raw.priority?.biggestOpportunity?.label ?? fallback.daily.priority.biggestOpportunity.label),
        category: asCategory(raw.priority?.biggestOpportunity?.category),
        reason: String(raw.priority?.biggestOpportunity?.reason ?? fallback.daily.priority.biggestOpportunity.reason),
      },
      mostImportantAction: String(
        raw.priority?.mostImportantAction ?? lever.todaysAction ?? fallback.daily.priority.mostImportantAction
      ),
    },
    trends,
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.filter((w) => w.message).map((w) => makeMessage({ ...w, type: 'warning' })).slice(0, 5)
      : fallback.daily.warnings,
    insights: Array.isArray(raw.insights)
      ? raw.insights
          .filter((i) => i.message)
          .map((i, idx) => ({
            id: `insight-ai-${idx}`,
            message: String(i.message),
            category: asCategory(i.category),
          }))
          .slice(0, 3)
      : fallback.daily.insights,
    characterCoach: Array.isArray(raw.characterCoach)
      ? raw.characterCoach
          .filter((c) => c.name && c.recommendation)
          .map((c) => ({
            name: String(c.name),
            level: typeof c.level === 'number' ? c.level : 1,
            recommendation: String(c.recommendation),
          }))
          .slice(0, 3)
      : fallback.daily.characterCoach,
    todaysFocus: [String(lever.todaysAction ?? fallback.daily.biggestLever.todaysAction)],
    advice: [],
    recommendations: [],
    improvements: [],
    primaryRecommendation: String(lever.context ?? fallback.daily.primaryRecommendation),
    generatedAt: Date.now(),
  }

  const weeklyRaw = raw.weekly
  const weekly: WeeklyCoachReview | null = fallback.weekly
    ? {
        ...fallback.weekly,
        summary: String(weeklyRaw?.summary ?? fallback.weekly.summary),
        nextWeekFocus: String(weeklyRaw?.nextWeekFocus ?? fallback.weekly.nextWeekFocus),
        bestImprovement: weeklyRaw?.bestImprovement != null ? String(weeklyRaw.bestImprovement) : fallback.weekly.bestImprovement,
        weakestArea: weeklyRaw?.weakestArea != null ? String(weeklyRaw.weakestArea) : fallback.weekly.weakestArea,
        highlights: Array.isArray(weeklyRaw?.highlights)
          ? weeklyRaw!.highlights!.map(String).slice(0, 4)
          : fallback.weekly.highlights,
      }
    : null

  return { daily, weekly }
}
