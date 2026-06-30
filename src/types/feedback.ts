export type FeedbackCategory =
  | 'bug'
  | 'feature'
  | 'improvement'
  | 'ai'
  | 'planner'
  | 'routine'
  | 'other'

export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

export interface FeedbackPayload {
  name?: string
  email?: string
  category: FeedbackCategory
  message: string
  page?: string
  browser?: string
  os?: string
  appVersion?: string
}

export interface FeedbackRecord {
  id: string
  userId: string | null
  category: string
  message: string
  page: string | null
  status: FeedbackStatus
  name: string | null
  email: string | null
  browser: string | null
  os: string | null
  appVersion: string | null
  createdAt: string
}
