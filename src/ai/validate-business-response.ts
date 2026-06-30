import type {
  BusinessIdeaAnalysis,
  CompetitionLevel,
  MvpTimeline,
  BusinessRiskType,
  MonetizationModel,
} from '@/types'

const MODELS: MonetizationModel[] = [
  'Subscription', 'One-time payment', 'Agency', 'Consulting', 'Affiliate', 'Marketplace',
]
const COMPETITION: CompetitionLevel[] = ['Low', 'Medium', 'High']
const MVP: MvpTimeline[] = ['Very Fast', 'Fast', 'Medium', 'Long']
const RISKS: BusinessRiskType[] = [
  'Market risk', 'Distribution risk', 'Execution risk', 'Technical risk',
]

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) return value as T
  return fallback
}

export function normalizeBusinessAnalysis(raw: Partial<BusinessIdeaAnalysis>): BusinessIdeaAnalysis {
  const models = Array.isArray(raw.monetization?.models)
    ? raw.monetization!.models!.filter((m): m is MonetizationModel =>
        typeof m === 'string' && MODELS.includes(m as MonetizationModel)
      ).slice(0, 3)
    : ['Consulting' as MonetizationModel]

  const roadmap = Array.isArray(raw.mvpRoadmap)
    ? raw.mvpRoadmap.filter((s) => typeof s === 'string' && s.trim()).map(String).slice(0, 5)
    : []

  while (roadmap.length < 5) {
    roadmap.push(`Complete MVP step ${roadmap.length + 1}`)
  }

  return {
    overallScore: clamp(Number(raw.overallScore) || 50, 0, 100),
    marketPotential: {
      score: clamp(Number(raw.marketPotential?.score) || 5, 1, 10),
      explanation: String(raw.marketPotential?.explanation ?? 'Market potential requires further validation.'),
    },
    monetization: {
      score: clamp(Number(raw.monetization?.score) || 5, 1, 10),
      models: models.length > 0 ? models : ['Consulting'],
      explanation: String(raw.monetization?.explanation ?? 'Define a clear revenue model and test willingness to pay.'),
    },
    difficulty: {
      score: clamp(Number(raw.difficulty?.score) || 5, 1, 10),
      technicalExplanation: String(raw.difficulty?.technicalExplanation ?? 'Technical scope depends on MVP definition.'),
      operationalExplanation: String(raw.difficulty?.operationalExplanation ?? 'Operational load depends on delivery model.'),
    },
    competition: {
      level: pickEnum(raw.competition?.level, COMPETITION, 'Medium'),
      explanation: String(raw.competition?.explanation ?? 'Competitive landscape needs research.'),
    },
    timeToMvp: {
      estimate: pickEnum(raw.timeToMvp?.estimate, MVP, 'Medium'),
      explanation: String(raw.timeToMvp?.explanation ?? 'Timeline depends on scope and resources.'),
    },
    biggestRisk: {
      type: pickEnum(raw.biggestRisk?.type, RISKS, 'Execution risk'),
      explanation: String(raw.biggestRisk?.explanation ?? 'Execution is the primary risk for early-stage ideas.'),
    },
    nextStep: String(raw.nextStep ?? 'Interview 10 potential users to validate demand.'),
    mvpRoadmap: roadmap,
    analyzedAt: Date.now(),
  }
}
