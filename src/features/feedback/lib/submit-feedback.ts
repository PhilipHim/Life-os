import type { FeedbackPayload } from '@/types/feedback'

export type { FeedbackCategory, FeedbackPayload } from '@/types/feedback'

const APP_VERSION = '0.1.0'

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Unknown'
}

function detectOs(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Unknown'
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const body: FeedbackPayload = {
    ...payload,
    page: payload.page ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
    browser: payload.browser ?? detectBrowser(),
    os: payload.os ?? detectOs(),
    appVersion: payload.appVersion ?? APP_VERSION,
  }

  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Failed to submit feedback')
  }
}

function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('networkerror')
}

export function feedbackErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : ''
  if (isNetworkError(raw)) {
    return 'Could not reach the server. Start the app with npm run dev, open http://localhost:3000, and try again.'
  }
  return raw || 'Something went wrong. Please try again in a moment.'
}
