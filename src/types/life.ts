export interface JournalEntry {
  id: string
  date: string
  mood: number
  energy: number
  gratitude: string
  intentions: string
  affirmations: string
  wins: string
  lessonsLearned: string
  reflection: string
  tomorrowFocus: string
  createdAt: number
  updatedAt: number
}

export interface SleepEntry {
  id: string
  date: string
  bedtime: string
  wakeTime: string
  totalSleepMinutes: number
  remMinutes: number
  deepMinutes: number
  lightMinutes: number
  awakeMinutes: number
  sleepScore: number
  createdAt: number
  updatedAt: number
}

export interface HealthEntry {
  id: string
  date: string
  steps?: number
  waterIntake?: number
  workoutMinutes?: number
  healthyEatingRating?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface HealthEvent {
  id: string
  type: 'sick' | 'recovered'
  date: string
  note?: string
  createdAt: number
  updatedAt: number
}

export interface Asset {
  id: string
  symbol: string
  name: string
  price: number
  previousPrice: number
  weekPrice: number
  monthPrice: number
  priceHistory: number[]
  createdAt: number
  updatedAt: number
}

export type BusinessIdeaStatus = 'idea' | 'researching' | 'building' | 'testing' | 'launched' | 'archived'

export type CompetitionLevel = 'Low' | 'Medium' | 'High'
export type MvpTimeline = 'Very Fast' | 'Fast' | 'Medium' | 'Long'
export type BusinessRiskType = 'Market risk' | 'Distribution risk' | 'Execution risk' | 'Technical risk'
export type MonetizationModel =
  | 'Subscription'
  | 'One-time payment'
  | 'Agency'
  | 'Consulting'
  | 'Affiliate'
  | 'Marketplace'

export interface BusinessIdeaAnalysis {
  overallScore: number
  marketPotential: { score: number; explanation: string }
  monetization: { score: number; models: MonetizationModel[]; explanation: string }
  difficulty: { score: number; technicalExplanation: string; operationalExplanation: string }
  competition: { level: CompetitionLevel; explanation: string }
  timeToMvp: { estimate: MvpTimeline; explanation: string }
  biggestRisk: { type: BusinessRiskType; explanation: string }
  nextStep: string
  mvpRoadmap: string[]
  analyzedAt: number
}

export interface BusinessIdea {
  id: string
  title: string
  description: string
  category: string
  status: BusinessIdeaStatus
  notes: string
  analysis?: BusinessIdeaAnalysis
  analysisSource?: 'gemini' | 'rules'
  createdAt: number
  updatedAt: number
}

export interface Quote {
  id: string
  text: string
  author?: string
  createdAt: number
  updatedAt: number
}

export interface CharacterArea {
  id: string
  name: string
  description: string
  tips: string
  level: number
  status?: 'active' | 'deleted'
  relatedHabits?: string[]
  relatedTasks?: string[]
  createdAt: number
  updatedAt: number
}
