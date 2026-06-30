export type XpSource =
  | 'task'
  | 'high_priority_task'
  | 'habit'
  | 'journal'
  | 'sleep'
  | 'workout'
  | 'health'
  | 'challenge'
  | 'mission'

export interface XpEvent {
  id: string
  key: string
  amount: number
  source: XpSource
  date: string
  timestamp: number
  label?: string
}

export interface XpState {
  totalXp: number
  awarded: Record<string, number>
  daily: Record<string, number>
  events: XpEvent[]
}

export interface XpHistory {
  daily: number
  weekly: number
  monthly: number
  totalXp: number
}
