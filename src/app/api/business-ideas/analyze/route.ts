import { NextResponse } from 'next/server'
import { generateGeminiJSON, isGeminiConfigured } from '@/ai/gemini-server'
import { BUSINESS_SYSTEM_PROMPT, buildBusinessUserPrompt } from '@/ai/business-prompt'
import { normalizeBusinessAnalysis } from '@/ai/validate-business-response'
import type { BusinessIdea, BusinessIdeaAnalysis } from '@/types'

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const idea = body.idea as BusinessIdea
    if (!idea?.title?.trim() && !idea?.description?.trim()) {
      return NextResponse.json({ error: 'Idea needs a title or description' }, { status: 400 })
    }

    const { data, model } = await generateGeminiJSON<Partial<BusinessIdeaAnalysis>>(
      BUSINESS_SYSTEM_PROMPT,
      buildBusinessUserPrompt(idea)
    )

    const analysis = normalizeBusinessAnalysis(data)
    return NextResponse.json({ analysis, source: 'gemini', model })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Business analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ configured: isGeminiConfigured() })
}
