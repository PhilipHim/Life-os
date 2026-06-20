import type { BusinessIdea, BusinessIdeaAnalysis } from '@/lib/types'
import type { BusinessAnalysisProvider } from '@/lib/business-coach/types'
import {
  scoreMarketPotential,
  scoreMonetization,
  scoreDifficulty,
  scoreCompetition,
  estimateTimeToMvp,
  identifyBiggestRisk,
  generateNextStep,
  generateMvpRoadmap,
  computeOverallScore,
} from '@/lib/business-coach/scoring'

export function analyzeBusinessIdea(idea: BusinessIdea): BusinessIdeaAnalysis {
  const marketPotential = scoreMarketPotential(idea)
  const monetization = scoreMonetization(idea)
  const difficulty = scoreDifficulty(idea)
  const competition = scoreCompetition(idea)
  const timeToMvp = estimateTimeToMvp(idea, difficulty.score)
  const biggestRisk = identifyBiggestRisk(
    marketPotential.score,
    monetization.score,
    difficulty.score,
    competition.level
  )
  const nextStep = generateNextStep(idea, marketPotential.score, difficulty.score, biggestRisk.type)
  const mvpRoadmap = generateMvpRoadmap(idea, nextStep)
  const overallScore = computeOverallScore(
    marketPotential.score,
    monetization.score,
    difficulty.score,
    competition.level,
    timeToMvp.estimate
  )

  return {
    overallScore,
    marketPotential,
    monetization,
    difficulty,
    competition,
    timeToMvp,
    biggestRisk,
    nextStep,
    mvpRoadmap,
    analyzedAt: Date.now(),
  }
}

export const ruleBasedBusinessProvider: BusinessAnalysisProvider = {
  name: 'rule-based',
  analyze: analyzeBusinessIdea,
}
