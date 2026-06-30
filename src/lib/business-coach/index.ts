import type { BusinessIdea, BusinessIdeaAnalysis } from '@/types'
import type { BusinessAnalysisProvider, BusinessAnalysisReport } from '@/lib/business-coach/types'
import { ruleBasedBusinessProvider } from '@/lib/business-coach/providers/rule-based'
import { computeBusinessIdeasStats } from '@/lib/business-coach/stats'
import { getBusinessIdeas, saveBusinessIdea } from '@/database/business-ideas'

let activeProvider: BusinessAnalysisProvider = ruleBasedBusinessProvider

export function setBusinessAnalysisProvider(provider: BusinessAnalysisProvider): void {
  activeProvider = provider
}

export function getBusinessAnalysisProvider(): BusinessAnalysisProvider {
  return activeProvider
}

export function analyzeIdea(idea: BusinessIdea): BusinessAnalysisReport {
  const analysis = activeProvider.analyze(idea)
  return { idea, analysis }
}

export interface AnalyzeIdeaResult {
  analysis: BusinessIdeaAnalysis
  source: 'gemini' | 'rules'
  error?: string
  model?: string
}

export async function analyzeIdeaAsync(idea: BusinessIdea): Promise<AnalyzeIdeaResult> {
  try {
    const res = await fetch('/api/business-ideas/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    })

    const data = await res.json()

    if (res.ok && data.analysis) {
      return {
        analysis: data.analysis as BusinessIdeaAnalysis,
        source: 'gemini',
        model: data.model,
      }
    }

    const errorMsg = data.error ?? `API error ${res.status}`
    return {
      analysis: activeProvider.analyze(idea),
      source: 'rules',
      error: errorMsg,
    }
  } catch (err) {
    return {
      analysis: activeProvider.analyze(idea),
      source: 'rules',
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export async function analyzeAndSaveIdeaAsync(idea: BusinessIdea): Promise<{
  idea: BusinessIdea
  source: 'gemini' | 'rules'
  error?: string
  model?: string
}> {
  const { analysis, source, error, model } = await analyzeIdeaAsync(idea)
  const updated = saveIdeaWithAnalysis(idea, analysis, source)
  return { idea: updated, source, error, model }
}

export function analyzeAndSaveIdea(idea: BusinessIdea): BusinessIdea {
  const analysis = activeProvider.analyze(idea)
  return saveIdeaWithAnalysis(idea, analysis, 'rules')
}

function saveIdeaWithAnalysis(
  idea: BusinessIdea,
  analysis: BusinessIdeaAnalysis,
  source: 'gemini' | 'rules'
): BusinessIdea {
  const updated: BusinessIdea = {
    ...idea,
    analysis,
    analysisSource: source,
    updatedAt: Date.now(),
    status: idea.status === 'idea' ? 'researching' : idea.status,
  }
  saveBusinessIdea(updated)
  return updated
}

export function getBusinessDashboardStats() {
  return computeBusinessIdeasStats(getBusinessIdeas())
}

export { ruleBasedBusinessProvider } from '@/lib/business-coach/providers/rule-based'
export { computeBusinessIdeasStats } from '@/lib/business-coach/stats'
export type { BusinessAnalysisProvider, BusinessIdeasStats, BusinessAnalysisReport } from '@/lib/business-coach/types'
