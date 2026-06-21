import type { MonthlyReview, MonthlyReviewSnapshot, ScoreTrend, TrendDirection } from '@/lib/monthly-review/types'
import { generateRuleBasedMonthlyReview } from '@/lib/monthly-review/rule-based'

const DIRECTIONS: TrendDirection[] = ['Improved', 'Declined', 'Stable', 'Unknown']

function asDirection(v: unknown): TrendDirection {
  return typeof v === 'string' && DIRECTIONS.includes(v as TrendDirection)
    ? (v as TrendDirection)
    : 'Unknown'
}

function asTrend(raw: Partial<ScoreTrend> | undefined, fallback: ScoreTrend): ScoreTrend {
  if (!raw) return fallback
  return {
    start: typeof raw.start === 'number' ? raw.start : fallback.start,
    end: typeof raw.end === 'number' ? raw.end : fallback.end,
    direction: asDirection(raw.direction) !== 'Unknown' ? asDirection(raw.direction) : fallback.direction,
    summary: String(raw.summary ?? fallback.summary),
  }
}

interface RawMonthlyReview {
  productivityTrend?: Partial<ScoreTrend>
  lifeScoreTrend?: Partial<ScoreTrend>
  sleepTrend?: Partial<ScoreTrend>
  healthTrend?: Partial<ScoreTrend>
  characterGrowth?: { name?: string; change?: number }[]
  financialProgress?: { summary?: string; monthPct?: number | null; weekPct?: number | null }
  mostImprovedArea?: string
  areaNeedingAttention?: string
  aiMonthlySummary?: string
}

export function normalizeMonthlyReview(
  raw: RawMonthlyReview,
  snapshot: MonthlyReviewSnapshot,
  source: 'gemini' | 'rules'
): MonthlyReview {
  const fallback = generateRuleBasedMonthlyReview(snapshot)

  const characterGrowth = Array.isArray(raw.characterGrowth)
    ? raw.characterGrowth
        .filter((c) => c.name)
        .map((c) => ({ name: String(c.name), change: typeof c.change === 'number' ? c.change : 1 }))
        .slice(0, 5)
    : fallback.characterGrowth

  return {
    productivityTrend: asTrend(raw.productivityTrend, fallback.productivityTrend),
    lifeScoreTrend: asTrend(raw.lifeScoreTrend, fallback.lifeScoreTrend),
    sleepTrend: asTrend(raw.sleepTrend, fallback.sleepTrend),
    healthTrend: asTrend(raw.healthTrend, fallback.healthTrend),
    characterGrowth: characterGrowth.length > 0 ? characterGrowth : fallback.characterGrowth,
    financialProgress: {
      summary: String(raw.financialProgress?.summary ?? fallback.financialProgress.summary),
      monthPct: raw.financialProgress?.monthPct ?? fallback.financialProgress.monthPct,
      weekPct: raw.financialProgress?.weekPct ?? fallback.financialProgress.weekPct,
    },
    mostImprovedArea: String(raw.mostImprovedArea ?? fallback.mostImprovedArea),
    areaNeedingAttention: String(raw.areaNeedingAttention ?? fallback.areaNeedingAttention),
    aiMonthlySummary: String(raw.aiMonthlySummary ?? fallback.aiMonthlySummary),
    generatedAt: Date.now(),
    source,
  }
}
