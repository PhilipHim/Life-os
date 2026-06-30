export interface Task {
  id: string
  title: string
  description: string
  notes: string
  completed: boolean
  deleted: boolean
  recurring: 'none' | 'daily' | 'weekly'
  completedAt: number | null
  createdAt: number
  priority: 'H1' | 'H2' | 'M' | 'L'
  estimatedDuration: number
}

export interface Project {
  id: string
  taskIds: string[]
  title: string
  description: string
  notes: string
  completed: boolean
  createdAt: number
}

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
