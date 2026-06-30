'use client'

import { useState, type FormEvent } from 'react'
import Card from '@/components/ui/Card'
import {
  submitFeedback,
  type FeedbackCategory,
  type FeedbackPayload,
} from '@/lib/feedback/submit-feedback'

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'ai', label: 'AI Feedback' },
  { value: 'planner', label: 'Planner' },
  { value: 'routine', label: 'Routine System' },
  { value: 'other', label: 'Other' },
]

const inputClassName =
  'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1'

const labelClassName =
  'mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-400'

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
      submittedAt: new Date().toISOString(),
    }

    try {
      await submitFeedback(payload)
      setIsSuccess(true)
      setName('')
      setEmail('')
      setCategory('improvement')
      setMessage('')
    } catch {
      setError('Something went wrong. Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="mt-8 border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-5 text-xl font-bold text-gray-900">Thank you!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          Your feedback helps shape the future of ASCEND.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-6 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          Send another message
        </button>
      </Card>
    )
  }

  return (
    <Card className="mt-8 border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="feedback-name" className={labelClassName}>
              Name <span className="normal-case tracking-normal text-gray-300">(optional)</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClassName}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="feedback-email" className={labelClassName}>
              Email <span className="normal-case tracking-normal text-gray-300">(optional)</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClassName}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="feedback-category" className={labelClassName}>
            Category
          </label>
          <select
            id="feedback-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            className={inputClassName}
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
          <label htmlFor="feedback-message" className={labelClassName}>
            Message
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you would improve..."
            rows={5}
            required
            className={`${inputClassName} min-h-[140px] resize-y py-3`}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            Early feedback directly influences what we build next.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </div>
      </form>
    </Card>
  )
}
