import type { BusinessIdea } from '@/types'
import type { BusinessIdeasStats } from '@/lib/business-coach/types'
import { computePromisingScore } from '@/lib/business-coach/scoring'

export function computeBusinessIdeasStats(ideas: BusinessIdea[]): BusinessIdeasStats {
  const analyzed = ideas.filter((i) => i.analysis)

  let averageScore: number | null = null
  if (analyzed.length > 0) {
    averageScore = Math.round(
      analyzed.reduce((s, i) => s + i.analysis!.overallScore, 0) / analyzed.length
    )
  }

  let highestScoringIdea: BusinessIdeasStats['highestScoringIdea'] = null
  for (const idea of analyzed) {
    const score = idea.analysis!.overallScore
    if (!highestScoringIdea || score > highestScoringIdea.score) {
      highestScoringIdea = { id: idea.id, title: idea.title, score }
    }
  }

  let mostPromisingIdea: BusinessIdeasStats['mostPromisingIdea'] = null
  for (const idea of analyzed) {
    const score = Math.round(computePromisingScore(idea.analysis!) * 10) / 10
    if (!mostPromisingIdea || score > mostPromisingIdea.score) {
      mostPromisingIdea = { id: idea.id, title: idea.title, score }
    }
  }

  return {
    ideasCreated: ideas.length,
    ideasAnalyzed: analyzed.length,
    averageScore,
    highestScoringIdea,
    mostPromisingIdea,
  }
}
