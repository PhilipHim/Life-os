'use client'

import type { WeeklyReview } from '@/lib/weekly-review/types'
import AISurface, { AIBadge, AIRecommendation } from '@/components/features/strategic/AISurface'

interface ReviewItemProps {
  icon: string
  label: string
  text: string
  tone?: 'success' | 'warning' | 'ai' | 'default'
}

const toneStyles: Record<NonNullable<ReviewItemProps['tone']>, string> = {
  success: 'border-los-success/30 bg-los-success/5',
  warning: 'border-los-warning/30 bg-los-warning/5',
  ai: 'border-los-border-ai bg-los-ai/5',
  default: 'border-los-border bg-los-bg-secondary/50',
}

function ReviewItem({ icon, label, text, tone = 'default' }: ReviewItemProps) {
  return (
    <div className={`los-ai-item border ${toneStyles[tone]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base leading-none">{icon}</span>
        <p className="los-ai-item-label">{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-los-text-primary">{text}</p>
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
  const poweredByGemini = review.source === 'gemini'

  return (
    <AISurface padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <AIBadge label="AI Weekly Review" poweredByGemini={poweredByGemini} />
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-wide text-los-text-primary">
            Your Week in Reflection
          </h2>
          {weekLabel && <p className="mt-1 text-sm text-los-text-secondary">{weekLabel}</p>}
        </div>
        {loading && <span className="text-[10px] text-los-ai animate-pulse shrink-0">Generating…</span>}
      </div>

      {error && review.source === 'rules' && (
        <div className="mt-4 rounded-lg border border-los-warning/40 bg-los-warning/10 px-3 py-2 text-xs text-los-warning">
          Gemini unavailable — showing offline review. {error.includes('429') ? 'Try again in a minute.' : ''}
        </div>
      )}

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <ReviewItem icon="🏆" label="Biggest Win" text={review.biggestWin} tone="success" />
        <ReviewItem icon="⚠️" label="Biggest Bottleneck" text={review.biggestBottleneck} tone="warning" />
        <ReviewItem icon="📈" label="Strongest Area" text={review.strongestArea} tone="ai" />
        <ReviewItem icon="📉" label="Weakest Area" text={review.weakestArea} tone="default" />
        <ReviewItem icon="✓" label="Best Habit" text={review.bestHabit} tone="ai" />
      </div>

      <div className="mt-4">
        <AIRecommendation label="AI Recommendation">{review.aiRecommendation}</AIRecommendation>
      </div>
    </AISurface>
  )
}
