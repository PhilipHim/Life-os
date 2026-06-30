import { NextResponse } from 'next/server'
import { generateGeminiJSON, isGeminiConfigured } from '@/ai/gemini-server'
import {
  WEEKLY_REVIEW_SYSTEM_PROMPT,
  buildWeeklyReviewUserPrompt,
} from '@/ai/weekly-review-prompt'
import { normalizeWeeklyReview } from '@/ai/validate-weekly-review'
import type { WeeklyReviewSnapshot } from '@/lib/weekly-review/types'

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const snapshot = body.snapshot as WeeklyReviewSnapshot
    if (!snapshot?.weekLabel) {
      return NextResponse.json({ error: 'Invalid snapshot' }, { status: 400 })
    }

    const { data, model } = await generateGeminiJSON<Record<string, unknown>>(
      WEEKLY_REVIEW_SYSTEM_PROMPT,
      buildWeeklyReviewUserPrompt(snapshot)
    )

    const review = normalizeWeeklyReview(data, snapshot, 'gemini')
    return NextResponse.json({ review, source: 'gemini', model })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Weekly review generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
