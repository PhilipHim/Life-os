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
