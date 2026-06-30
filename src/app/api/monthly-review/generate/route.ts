import { NextResponse } from 'next/server'
import { generateGeminiJSON, isGeminiConfigured } from '@/ai/gemini-server'
import {
  MONTHLY_REVIEW_SYSTEM_PROMPT,
  buildMonthlyReviewUserPrompt,
} from '@/ai/monthly-review-prompt'
import { normalizeMonthlyReview } from '@/ai/validate-monthly-review'
import { buildMonthlyReviewSnapshot } from '@/lib/monthly-review/build-snapshot'
import type { MonthlyReviewSnapshot } from '@/lib/monthly-review/types'

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const snapshot = (body.snapshot ?? buildMonthlyReviewSnapshot()) as MonthlyReviewSnapshot

    const { data, model } = await generateGeminiJSON<Record<string, unknown>>(
      MONTHLY_REVIEW_SYSTEM_PROMPT,
      buildMonthlyReviewUserPrompt(snapshot)
    )

    const review = normalizeMonthlyReview(data, snapshot, 'gemini')
    return NextResponse.json({ review, source: 'gemini', model })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Monthly review generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
