export interface WorkItem {
  id: string
  type: 'single' | 'group'
  title: string
  description: string
  notes: string
  status: 'active' | 'completed' | 'deleted'
  createdAt: number
  updatedAt: number
  parentId?: string
  childrenIds: string[]
  completedAt?: number | null
  recurring?: boolean
  recurrenceType?: 'daily' | 'weekly'
  daysOfWeek?: number[]
  isTemplate?: boolean
}

export interface Habit {
  id: string
  title: string
  description: string
  kind: 'build' | 'avoid'
  type: 'checkbox' | 'time' | 'quantity'
  targetValue: number
  createdAt: number
  status: 'active' | 'deleted'
}

export interface HabitEntry {
  id: string
  habitId: string
  date: string
  value: number
  completed: boolean
}

export interface DailyPlanItem {
  id: string
  workItemId: string
  priority: 'H1' | 'H2' | 'M' | 'L'
  estimatedDuration: number
  startTime?: string
  date: string
  createdAt: number
  orderIndex: number
}

export interface FocusSession {
  id: string
  workItemId: string
  startTime: number
  endTime: number
  duration: number
  date: string
  createdAt: number
}

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

export interface BusinessIdea {
  id: string
  title: string
  description: string
  category: string
  status: BusinessIdeaStatus
  notes: string
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
