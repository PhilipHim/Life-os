'use client'

import { useState, type FormEvent } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  submitFeedback,
  feedbackErrorMessage,
  type FeedbackCategory,
  type FeedbackPayload,
} from '@/features/feedback/lib/submit-feedback'

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'ai', label: 'AI Feedback' },
  { value: 'planner', label: 'Planner' },
  { value: 'routine', label: 'Routine System' },
  { value: 'other', label: 'Other' },
]

export default function FeedbackSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('improvement')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please enter a message before sending.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const payload: FeedbackPayload = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      category,
      message: message.trim(),
      page: '/',
    }

    try {
      await submitFeedback(payload)
      setIsSuccess(true)
      setName('')
      setEmail('')
      setCategory('improvement')
      setMessage('')
    } catch (err) {
      setError(feedbackErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-los-success/15 text-los-success">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-los-text-primary">Thank you!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-los-text-secondary">
          Your feedback helps shape the future of ASCEND.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-6 text-sm font-medium text-los-gold transition-colors hover:text-los-gold-light"
        >
          Send another message
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="feedback-name" className="los-section-label mb-1.5 block">
              Name <span className="normal-case tracking-normal text-los-text-muted">(optional)</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="los-input w-full"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="feedback-email" className="los-section-label mb-1.5 block">
              Email <span className="normal-case tracking-normal text-los-text-muted">(optional)</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="los-input w-full"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="feedback-category" className="los-section-label mb-1.5 block">
            Category
          </label>
          <select
            id="feedback-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            className="los-select w-full"
            required
          >
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback-message" className="los-section-label mb-1.5 block">
            Message
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you would improve..."
            rows={5}
            required
            className="los-textarea w-full"
          />
        </div>

        {error && (
          <p className="text-sm text-los-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-los-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-los-text-muted">
            Early feedback directly influences what we build next.
          </p>
          <Button type="submit" disabled={isSubmitting} className="shrink-0">
            {isSubmitting ? 'Sending…' : 'Send Feedback'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
