export type TrendDirection = 'improving' | 'declining' | 'stable'

export interface DaySnapshot {
  date: string
  weekday: number
  weekdayName: string
  productivity: number
  lifeScore: number
  sleepScore: number | null
  healthScore: number | null
  habitScore: number
  journalLogged: boolean
  tasksCompleted: number
  focusMinutes: number
  focusPct: number
  workoutLogged: boolean
  sickDay: boolean
}

export interface IntelligenceInsight {
  id: string
  text: string
}

export interface PerformancePeak {
  label: string
  date: string
  displayDate: string
  value: number
  unit: string
}

export interface WeakArea {
  id: string
  label: string
  detail: string
}

export interface TrendInsight {
  id: string
  metric: string
  direction: TrendDirection
  message: string
  changePct: number | null
}

export interface PatternLink {
  id: string
  cause: string
  effect: string
  message: string
  strength: number
}

export interface SmartRecommendation {
  id: string
  basedOn: string
  recommendation: string
}

export interface LifeIntelligenceReport {
  hasData: boolean
  dataDays: number
  personalInsights: IntelligenceInsight[]
  bestPerformance: PerformancePeak[]
  weakestAreas: WeakArea[]
  trends: TrendInsight[]
  patterns: PatternLink[]
  recommendations: SmartRecommendation[]
}
