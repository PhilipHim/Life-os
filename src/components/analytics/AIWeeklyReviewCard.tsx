'use client'

import type { WeeklyReview } from '@/lib/weekly-review/types'
import Card from '@/components/ui/Card'

interface ReviewItemProps {
  icon: string
  label: string
  text: string
  accent?: 'green' | 'amber' | 'indigo' | 'violet' | 'blue' | 'gray'
}

const accentStyles: Record<NonNullable<ReviewItemProps['accent']>, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  gray: 'bg-gray-50 text-gray-700 border-gray-100',
}

function ReviewItem({ icon, label, text, accent = 'gray' }: ReviewItemProps) {
  return (
    <div className={`rounded-xl border p-4 ${accentStyles[accent]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base leading-none">{icon}</span>
        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-gray-900">{text}</p>
    </div>
  )
}

interface Props {
  review: WeeklyReview
  weekLabel?: string
  loading?: boolean
  error?: string | null
}

export default function AIWeeklyReviewCard({ review, weekLabel, loading, error }: Props) {
  return (
    <Card className="relative overflow-hidden ring-1 ring-indigo-500/10 shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-50/70 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
              AI Weekly Review
              {review.source === 'gemini' && <span> · Gemini</span>}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 tracking-tight">Your Week in Reflection</h2>
            {weekLabel && <p className="mt-0.5 text-sm text-gray-500">{weekLabel}</p>}
          </div>
          {loading && (
            <span className="text-[10px] text-gray-400 animate-pulse shrink-0">Generating…</span>
          )}
        </div>

        {error && review.source === 'rules' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Gemini unavailable — showing offline review. {error.includes('429') ? 'Try again in a minute.' : ''}
          </div>
        )}

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <ReviewItem icon="🏆" label="Biggest Win" text={review.biggestWin} accent="green" />
          <ReviewItem icon="⚠️" label="Biggest Bottleneck" text={review.biggestBottleneck} accent="amber" />
          <ReviewItem icon="📈" label="Strongest Area" text={review.strongestArea} accent="indigo" />
          <ReviewItem icon="📉" label="Weakest Area" text={review.weakestArea} accent="blue" />
          <ReviewItem icon="✓" label="Best Habit" text={review.bestHabit} accent="violet" />
        </div>

        <div className="mt-4 rounded-xl bg-gray-900 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Recommendation</p>
          <p className="mt-1.5 text-sm font-medium text-white leading-relaxed">{review.aiRecommendation}</p>
        </div>
      </div>
    </Card>
  )
}
