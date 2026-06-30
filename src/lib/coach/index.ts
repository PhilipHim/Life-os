import type { CoachContextInput } from '@/lib/coach/context'
import { buildCoachContext } from '@/lib/coach/context'
import type { CoachReport } from '@/lib/coach/types'
import type { CoachProvider } from '@/lib/coach/providers/types'
import { ruleBasedCoachProvider } from '@/lib/coach/providers/rule-based'
import { serializeCoachContextForAI } from '@/ai/coach-prompt'
import { mergeAICoachReport } from '@/ai/validate-coach-response'

let activeProvider: CoachProvider = ruleBasedCoachProvider

export function setCoachProvider(provider: CoachProvider): void {
  activeProvider = provider
}

export function getCoachProvider(): CoachProvider {
  return activeProvider
}

export function generateCoachReport(input: CoachContextInput): CoachReport {
  const context = buildCoachContext(input)
  return activeProvider.generate(context)
}

export interface CoachReportResult {
  report: CoachReport
  source: 'gemini' | 'rules'
  error?: string
  model?: string
}

export async function generateCoachReportAsync(input: CoachContextInput): Promise<CoachReportResult> {
  const context = buildCoachContext(input)
  const fallback = ruleBasedCoachProvider.generate(context)

  try {
    const res = await fetch('/api/coach/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: serializeCoachContextForAI(context) }),
    })

    const data = await res.json()

    if (res.ok && data.report) {
      return {
        report: mergeAICoachReport(data.report, context, fallback),
        source: 'gemini',
        model: data.model,
      }
    }

    return {
      report: fallback,
      source: 'rules',
      error: data.error ?? `API error ${res.status}`,
    }
  } catch (err) {
    return {
      report: fallback,
      source: 'rules',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export { ruleBasedCoachProvider } from '@/lib/coach/providers/rule-based'
export type { CoachProvider } from '@/lib/coach/providers/types'
export type { CoachContextInput } from '@/lib/coach/context'
export type {
  CoachReport,
  DailyCoachReport,
  WeeklyCoachReview,
  CoachMessage,
  BiggestLever,
  CoachPriority,
  TrendMetric,
  CharacterCoachItem,
  CoachInsight,
} from '@/lib/coach/types'
