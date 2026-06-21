import { buildWeeklyReviewSnapshot } from '@/lib/weekly-review/build-snapshot'
import { generateRuleBasedWeeklyReview } from '@/lib/weekly-review/rule-based'
import type { WeeklyReviewResult } from '@/lib/weekly-review/types'

export async function generateWeeklyReviewAsync(): Promise<WeeklyReviewResult> {
  const snapshot = buildWeeklyReviewSnapshot()
  const fallback = generateRuleBasedWeeklyReview(snapshot)

  try {
    const res = await fetch('/api/weekly-review/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot }),
    })

    const data = await res.json()

    if (res.ok && data.review) {
      return {
        review: { ...data.review, source: 'gemini', generatedAt: Date.now() },
        model: data.model,
      }
    }

    return {
      review: fallback,
      error: data.error ?? `API error ${res.status}`,
    }
  } catch (err) {
    return {
      review: fallback,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export type { WeeklyReview, WeeklyReviewSnapshot, WeeklyReviewResult } from '@/lib/weekly-review/types'
export { buildWeeklyReviewSnapshot } from '@/lib/weekly-review/build-snapshot'
