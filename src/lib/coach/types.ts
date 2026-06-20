export type CoachMessageType = 'advice' | 'warning' | 'recommendation' | 'improvement'

export type CoachCategory =
  | 'productivity'
  | 'health'
  | 'sleep'
  | 'habits'
  | 'character'
  | 'life'
  | 'planner'
  | 'journal'
  | 'business'

export type TrendDirection = 'declining' | 'improving' | 'stable'

export interface CoachMessage {
  id: string
  type: CoachMessageType
  category: CoachCategory
  title?: string
  message: string
  priority: number
}

export interface TrendMetric {
  label: string
  category: CoachCategory
  values: number[]
  direction: TrendDirection
  unit: 'score' | 'percent'
}

export interface BiggestLever {
  title: string
  category: CoachCategory
  context: string
  impactAreas: string[]
  todaysAction: string
  score: number
}

export interface CoachPriority {
  biggestBottleneck: { label: string; category: CoachCategory; reason: string }
  biggestOpportunity: { label: string; category: CoachCategory; reason: string }
  mostImportantAction: string
}

export interface CharacterCoachItem {
  name: string
  level: number
  recommendation: string
}

export interface CoachInsight {
  id: string
  message: string
  category: CoachCategory
}

export interface DailyCoachReport {
  biggestLever: BiggestLever
  priority: CoachPriority
  trends: TrendMetric[]
  warnings: CoachMessage[]
  insights: CoachInsight[]
  characterCoach: CharacterCoachItem[]
  /** @deprecated kept for provider compatibility */
  todaysFocus: string[]
  advice: CoachMessage[]
  recommendations: CoachMessage[]
  improvements: CoachMessage[]
  primaryRecommendation: string | null
  generatedAt: number
}

export interface WeeklyMetricChange {
  label: string
  value: number
  unit: 'percent' | 'level' | 'score'
  category: CoachCategory
}

export interface CharacterWeeklyChange {
  name: string
  change: number
}

export interface WeeklyCoachReview {
  metrics: WeeklyMetricChange[]
  characterChanges: CharacterWeeklyChange[]
  bestImprovement: string | null
  weakestArea: string | null
  summary: string
  nextWeekFocus: string
  highlights: string[]
}

export interface CoachReport {
  daily: DailyCoachReport
  weekly: WeeklyCoachReview | null
}
