import type {
  BusinessIdea,
  BusinessIdeaAnalysis,
  CompetitionLevel,
  MvpTimeline,
  BusinessRiskType,
  MonetizationModel,
} from '@/types'

export type {
  BusinessIdeaAnalysis,
  CompetitionLevel,
  MvpTimeline,
  BusinessRiskType,
  MonetizationModel,
}

export interface BusinessIdeasStats {
  ideasCreated: number
  ideasAnalyzed: number
  averageScore: number | null
  highestScoringIdea: { id: string; title: string; score: number } | null
  mostPromisingIdea: { id: string; title: string; score: number } | null
}

export interface BusinessAnalysisProvider {
  readonly name: string
  analyze(idea: BusinessIdea): BusinessIdeaAnalysis
}

export interface BusinessAnalysisReport {
  idea: BusinessIdea
  analysis: BusinessIdeaAnalysis
}
