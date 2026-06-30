import type { WeeklyReview } from '@/lib/weekly-review/types'
import { generateRuleBasedWeeklyReview } from '@/lib/weekly-review/rule-based'
import type { WeeklyReviewSnapshot } from '@/lib/weekly-review/types'

interface RawWeeklyReview {
  biggestWin?: string
  biggestBottleneck?: string
  strongestArea?: string
  weakestArea?: string
  bestHabit?: string
  aiRecommendation?: string
}

export function normalizeWeeklyReview(
  raw: RawWeeklyReview,
  snapshot: WeeklyReviewSnapshot,
  source: 'gemini' | 'rules'
): WeeklyReview {
  const fallback = generateRuleBasedWeeklyReview(snapshot)

  return {
    biggestWin: String(raw.biggestWin ?? fallback.biggestWin),
    biggestBottleneck: String(raw.biggestBottleneck ?? fallback.biggestBottleneck),
    strongestArea: String(raw.strongestArea ?? fallback.strongestArea),
    weakestArea: String(raw.weakestArea ?? fallback.weakestArea),
    bestHabit: String(raw.bestHabit ?? fallback.bestHabit),
    aiRecommendation: String(raw.aiRecommendation ?? fallback.aiRecommendation),
    generatedAt: Date.now(),
    source,
  }
}
