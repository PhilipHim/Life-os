import { NextResponse } from 'next/server'
import { generateGeminiJSON, isGeminiConfigured } from '@/ai/gemini-server'
import {
  COACH_SYSTEM_PROMPT,
  buildCoachUserPrompt,
  type CoachAISnapshot,
} from '@/ai/coach-prompt'

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const snapshot = body.snapshot as CoachAISnapshot
    if (!snapshot?.today) {
      return NextResponse.json({ error: 'Invalid snapshot' }, { status: 400 })
    }

    const { data, model } = await generateGeminiJSON<Record<string, unknown>>(
      COACH_SYSTEM_PROMPT,
      buildCoachUserPrompt(snapshot)
    )

    return NextResponse.json({ report: data, source: 'gemini', model })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Coach generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isGeminiConfigured(),
    models: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash (with fallbacks)',
  })
}
