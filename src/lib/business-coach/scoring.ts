import type {
  BusinessIdea,
  BusinessIdeaAnalysis,
  CompetitionLevel,
  MvpTimeline,
  BusinessRiskType,
  MonetizationModel,
} from '@/lib/types'

const MARKET_KEYWORDS = [
  { words: ['saas', 'platform', 'marketplace', 'b2b', 'enterprise'], boost: 2 },
  { words: ['ai', 'automation', 'tool', 'app'], boost: 1.5 },
  { words: ['niche', 'local', 'manual', 'custom'], boost: -1 },
  { words: ['everyone', 'global', 'millions', 'viral'], boost: 1 },
]

const TECH_KEYWORDS = ['ai', 'ml', 'blockchain', 'hardware', 'api', 'integration', 'algorithm', 'database']
const CONTENT_KEYWORDS = ['blog', 'newsletter', 'youtube', 'podcast', 'course', 'content']
const SERVICE_KEYWORDS = ['agency', 'consulting', 'freelance', 'service', 'coaching']

function combinedText(idea: BusinessIdea): string {
  return `${idea.title} ${idea.description} ${idea.notes}`.toLowerCase()
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w))
}

function countMatches(text: string, words: string[]): number {
  return words.filter((w) => text.includes(w)).length
}

export function scoreMarketPotential(idea: BusinessIdea): { score: number; explanation: string } {
  const text = combinedText(idea)
  let score = 5

  const categoryBoost: Record<string, number> = {
    Startup: 1.5,
    App: 1,
    'AI Business': 1.5,
    Content: 0.5,
    Project: 0,
    Other: 0,
  }
  score += categoryBoost[idea.category] ?? 0

  for (const { words, boost } of MARKET_KEYWORDS) {
    if (hasAny(text, words)) score += boost
  }

  const descWords = wordCount(idea.description)
  if (descWords >= 30) score += 0.5
  if (descWords < 10) score -= 1

  if (idea.status === 'launched') score += 1
  if (idea.status === 'testing') score += 0.5

  score = Math.round(Math.min(10, Math.max(1, score)))

  let explanation = ''
  if (score >= 8) {
    explanation = 'Strong demand signals — the problem space appears large and the category supports scalable growth.'
  } else if (score >= 6) {
    explanation = 'Moderate demand likely exists. A defined audience and clear pain point could support a viable business.'
  } else if (score >= 4) {
    explanation = 'Demand may exist in a narrower segment. Validation with real users is essential before scaling.'
  } else {
    explanation = 'Market demand is unclear or highly niche. Focus on finding a specific, paying customer segment first.'
  }

  if (hasAny(text, ['problem', 'pain', 'struggle', 'need'])) {
    explanation += ' The idea references a clear customer pain point.'
  }

  return { score, explanation }
}

export function scoreMonetization(idea: BusinessIdea): {
  score: number
  models: MonetizationModel[]
  explanation: string
} {
  const text = combinedText(idea)
  const models: MonetizationModel[] = []

  if (idea.category === 'App' || hasAny(text, ['saas', 'subscription', 'monthly'])) {
    models.push('Subscription')
  }
  if (idea.category === 'Content' || hasAny(text, CONTENT_KEYWORDS)) {
    models.push('Affiliate', 'Subscription')
  }
  if (hasAny(text, SERVICE_KEYWORDS) || idea.category === 'Project') {
    models.push('Agency', 'Consulting')
  }
  if (hasAny(text, ['marketplace', 'platform', 'connect', 'match'])) {
    models.push('Marketplace')
  }
  if (hasAny(text, ['template', 'download', 'license', 'one-time', 'course'])) {
    models.push('One-time payment')
  }

  if (models.length === 0) {
    if (idea.category === 'Startup') models.push('Subscription', 'Consulting')
    else if (idea.category === 'AI Business') models.push('Subscription', 'One-time payment')
    else models.push('One-time payment', 'Consulting')
  }

  const unique = [...new Set(models)].slice(0, 3)
  let score = 4 + unique.length
  if (hasAny(text, ['revenue', 'pricing', 'pay', 'monetize', 'subscription'])) score += 1.5
  if (idea.status === 'launched' || idea.status === 'testing') score += 1
  score = Math.round(Math.min(10, Math.max(1, score)))

  const modelList = unique.join(', ')
  const explanation = `Best-fit models: ${modelList}. ${
    score >= 7
      ? 'Multiple viable revenue paths — start with the simplest to validate willingness to pay.'
      : 'Revenue model needs refinement. Test one model with 5–10 potential customers before building more.'
  }`

  return { score, models: unique, explanation }
}

export function scoreDifficulty(idea: BusinessIdea): {
  score: number
  technicalExplanation: string
  operationalExplanation: string
} {
  const text = combinedText(idea)
  let score = 4

  if (idea.category === 'AI Business' || idea.category === 'App') score += 2
  if (hasAny(text, TECH_KEYWORDS)) score += 2
  if (idea.category === 'Content') score -= 2
  if (hasAny(text, SERVICE_KEYWORDS)) score -= 1
  if (hasAny(text, ['no-code', 'simple', 'landing page', 'manual'])) score -= 1.5

  score = Math.round(Math.min(10, Math.max(1, score)))

  const technicalExplanation =
    score >= 7
      ? 'Requires significant engineering — custom development, integrations, or AI infrastructure.'
      : score >= 5
        ? 'Moderate build complexity — standard web/mobile stack with some custom features.'
        : 'Low technical barrier — can launch with existing tools, templates, or no-code solutions.'

  const operationalExplanation =
    hasAny(text, SERVICE_KEYWORDS) || idea.category === 'Project'
      ? 'High operational load — delivery depends on your time, client management, and quality control.'
      : score >= 7
        ? 'Ongoing ops include hosting, support, updates, and monitoring as you scale.'
        : 'Lean operations — minimal overhead beyond marketing and customer communication.'

  return { score, technicalExplanation, operationalExplanation }
}

export function scoreCompetition(idea: BusinessIdea): { level: CompetitionLevel; explanation: string } {
  const text = combinedText(idea)
  let competitionScore = 5

  if (idea.category === 'AI Business' || idea.category === 'App') competitionScore += 2
  if (hasAny(text, ['ai', 'chatbot', 'productivity', 'fitness', 'todo'])) competitionScore += 1.5
  if (hasAny(text, ['niche', 'specific', 'vertical', 'industry'])) competitionScore -= 1.5
  if (hasAny(text, ['local', 'regional', 'b2b'])) competitionScore -= 1

  let level: CompetitionLevel = 'Medium'
  if (competitionScore >= 7) level = 'High'
  else if (competitionScore <= 4) level = 'Low'

  const explanation =
    level === 'High'
      ? 'Crowded space with established players. Differentiation and a sharp niche are critical.'
      : level === 'Low'
        ? 'Limited direct competition — opportunity to define the category if you move quickly.'
        : 'Moderate competition — success depends on positioning, speed, and customer experience.'

  return { level, explanation }
}

export function estimateTimeToMvp(idea: BusinessIdea, difficulty: number): {
  estimate: MvpTimeline
  explanation: string
} {
  const text = combinedText(idea)
  let estimate: MvpTimeline = 'Medium'

  if (idea.category === 'Content' || difficulty <= 3) estimate = 'Very Fast'
  else if (difficulty <= 5 && !hasAny(text, TECH_KEYWORDS)) estimate = 'Fast'
  else if (difficulty >= 8 || hasAny(text, ['platform', 'marketplace', 'hardware'])) estimate = 'Long'
  else estimate = 'Medium'

  const timelines: Record<MvpTimeline, string> = {
    'Very Fast': '1–2 weeks — landing page, content, or simple offer to test demand.',
    Fast: '2–4 weeks — basic prototype or service package with manual fulfillment.',
    Medium: '1–2 months — functional MVP with core features and early user testing.',
    Long: '3+ months — complex build requiring architecture, integrations, or compliance.',
  }

  return { estimate, explanation: timelines[estimate] }
}

export function identifyBiggestRisk(
  market: number,
  monetization: number,
  difficulty: number,
  competition: CompetitionLevel
): { type: BusinessRiskType; explanation: string } {
  const risks: { type: BusinessRiskType; weight: number; explanation: string }[] = []

  if (market <= 4) {
    risks.push({
      type: 'Market risk',
      weight: 10 - market,
      explanation: 'Unclear or insufficient market demand — customers may not pay for this solution.',
    })
  }

  if (competition === 'High') {
    risks.push({
      type: 'Distribution risk',
      weight: 8,
      explanation: 'Standing out and acquiring customers will be expensive and slow in a crowded market.',
    })
  }

  if (difficulty >= 7) {
    risks.push({
      type: 'Technical risk',
      weight: difficulty,
      explanation: 'Build complexity may delay launch and burn resources before validation.',
    })
  }

  if (monetization <= 4) {
    risks.push({
      type: 'Market risk',
      weight: 7,
      explanation: 'Revenue model is unproven — pricing and willingness to pay need validation.',
    })
  }

  risks.push({
    type: 'Execution risk',
    weight: 5,
    explanation: 'Solo execution across product, marketing, and sales is the default bottleneck.',
  })

  const top = risks.sort((a, b) => b.weight - a.weight)[0]
  return { type: top.type, explanation: top.explanation }
}

export function generateNextStep(
  idea: BusinessIdea,
  market: number,
  difficulty: number,
  risk: BusinessRiskType
): string {
  if (idea.status === 'idea' || idea.status === 'researching') {
    if (market <= 5 || risk === 'Market risk') return 'Interview 10 potential users to validate demand.'
    if (difficulty <= 4) return 'Create a landing page with a clear value proposition and waitlist.'
    return 'Build a clickable prototype to test core assumptions.'
  }
  if (idea.status === 'building') return 'Ship the smallest testable version to 5 early users this week.'
  if (idea.status === 'testing') return 'Collect structured feedback and measure one key metric.'
  if (risk === 'Distribution risk') return 'Run one targeted outreach campaign to your ideal customer profile.'
  if (difficulty >= 7) return 'Break the MVP into one core feature and build only that first.'
  return 'Validate demand with a pre-sale or paid pilot before expanding scope.'
}

export function generateMvpRoadmap(idea: BusinessIdea, nextStep: string): string[] {
  const text = combinedText(idea)
  const title = idea.title.trim() || 'this idea'

  const steps: string[] = [
    `Define the target customer and core problem for ${title}`,
    'Interview 5–10 potential users and document pain points',
  ]

  if (hasAny(text, ['landing', 'waitlist']) || idea.status === 'idea') {
    steps.push('Create landing page with value proposition and email capture')
  } else {
    steps.push('Build a minimal prototype or mockup of the core solution')
  }

  steps.push(nextStep.includes('Interview') ? 'Synthesize feedback into one clear value proposition' : nextStep)
  steps.push('Launch to 10–20 early users and measure one success metric')
  steps.push('Iterate based on feedback — keep, change, or kill the idea')

  return steps.slice(0, 5)
}

export function computeOverallScore(
  market: number,
  monetization: number,
  difficulty: number,
  competition: CompetitionLevel,
  timeToMvp: MvpTimeline
): number {
  const competitionPenalty = competition === 'High' ? 8 : competition === 'Medium' ? 4 : 0
  const difficultyPenalty = (difficulty - 5) * 2
  const timeBonus = timeToMvp === 'Very Fast' ? 5 : timeToMvp === 'Fast' ? 3 : timeToMvp === 'Long' ? -5 : 0

  const raw =
    market * 8 +
    monetization * 7 +
    (10 - difficulty) * 5 +
    timeBonus -
    competitionPenalty

  return Math.round(Math.min(100, Math.max(0, raw + 15)))
}

export function computePromisingScore(analysis: BusinessIdeaAnalysis): number {
  const competitionPenalty = analysis.competition.level === 'High' ? 2 : analysis.competition.level === 'Medium' ? 1 : 0
  const timeBonus = analysis.timeToMvp.estimate === 'Very Fast' ? 1.5 : analysis.timeToMvp.estimate === 'Fast' ? 1 : 0
  return (
    analysis.marketPotential.score * 0.35 +
    analysis.monetization.score * 0.25 +
    (10 - analysis.difficulty.score) * 0.2 +
    analysis.overallScore / 10 * 0.2 -
    competitionPenalty +
    timeBonus
  )
}
