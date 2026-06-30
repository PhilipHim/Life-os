export type FeedbackCategory =
  | 'bug'
  | 'feature'
  | 'improvement'
  | 'ai'
  | 'planner'
  | 'routine'
  | 'other'

export interface FeedbackPayload {
  name?: string
  email?: string
  category: FeedbackCategory
  message: string
  submittedAt: string
}

/** Placeholder handler — replace with `POST /api/feedback` when a backend is ready. */
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (process.env.NODE_ENV === 'development') {
    console.info('[ASCEND Feedback]', payload)
  }
}
