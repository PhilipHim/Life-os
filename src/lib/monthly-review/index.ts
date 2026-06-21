import { buildMonthlyReviewSnapshot } from '@/lib/monthly-review/build-snapshot'
import { generateRuleBasedMonthlyReview } from '@/lib/monthly-review/rule-based'
import type { MonthlyReviewResult } from '@/lib/monthly-review/types'

export async function generateMonthlyReviewAsync(): Promise<MonthlyReviewResult> {
  const snapshot = buildMonthlyReviewSnapshot()
  const fallback = generateRuleBasedMonthlyReview(snapshot)

  try {
    const res = await fetch('/api/monthly-review/generate', {
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

export type { MonthlyReview, MonthlyReviewSnapshot, MonthlyReviewResult } from '@/lib/monthly-review/types'
export { buildMonthlyReviewSnapshot } from '@/lib/monthly-review/build-snapshot'
