export type TrendDirection = 'Improved' | 'Declined' | 'Stable' | 'Unknown'

export interface ScoreTrend {
  start: number | null
  end: number | null
  direction: TrendDirection
  summary: string
}

export interface CharacterGrowthItem {
  name: string
  change: number
}

export interface MonthlyReview {
  productivityTrend: ScoreTrend
  lifeScoreTrend: ScoreTrend
  sleepTrend: ScoreTrend
  healthTrend: ScoreTrend
  characterGrowth: CharacterGrowthItem[]
  financialProgress: {
    summary: string
    monthPct: number | null
    weekPct: number | null
  }
  mostImprovedArea: string
  areaNeedingAttention: string
  aiMonthlySummary: string
  generatedAt: number
  source: 'gemini' | 'rules'
}

export interface MonthlyReviewSnapshot {
  monthLabel: string
  daysTrackedThisMonth: number
  productivity: { thisMonthAvg: number; lastMonthAvg: number; change: number | null }
  lifeScore: { thisMonthAvg: number; lastMonthAvg: number; change: number | null }
  sleep: { thisMonthAvg: number | null; lastMonthAvg: number | null; change: number | null }
  health: { thisMonthAvg: number | null; lastMonthAvg: number | null; change: number | null }
  character: {
    traitsUpdatedThisMonth: number
    growth: CharacterGrowthItem[]
    strongestTrait: string | null
    weakestTrait: string | null
  }
  finance: {
    portfolioMonthPct: number | null
    portfolioWeekPct: number | null
    hasData: boolean
  }
  habits: { avgScoreThisMonth: number; avgScoreLastMonth: number }
  journal: { daysThisMonth: number; avgMood: number | null }
  illnessFreeDays: number
}

export interface MonthlyReviewResult {
  review: MonthlyReview
  error?: string
  model?: string
}
