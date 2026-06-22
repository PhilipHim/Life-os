'use client'

import type { MonthlyReview, ScoreTrend } from '@/lib/monthly-review/types'
import AISurface, { AIBadge, AIRecommendation } from '@/components/strategic/AISurface'
import Card from '@/components/ui/Card'

const directionColor: Record<string, string> = {
  Improved: 'text-los-success',
  Declined: 'text-los-warning',
  Stable: 'text-los-text-secondary',
  Unknown: 'text-los-text-muted',
}

function TrendRow({ label, trend }: { label: string; trend: ScoreTrend }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-los-border-subtle last:border-0">
      <div>
        <p className="los-section-label">{label}</p>
        <p className="mt-1 text-lg font-bold tabular-nums text-los-text-primary">{trend.summary}</p>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${directionColor[trend.direction] ?? directionColor.Unknown}`}>
        {trend.direction}
      </span>
    </div>
  )
}

interface Props {
  review: MonthlyReview
  monthLabel?: string
  loading?: boolean
  error?: string | null
}

export default function AIMonthlyReviewCard({ review, monthLabel, loading, error }: Props) {
  const poweredByGemini = review.source === 'gemini'

  return (
    <AISurface padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <AIBadge label="AI Monthly Review" poweredByGemini={poweredByGemini} />
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-wide text-los-text-primary">
            Your Month in Review
          </h2>
          {monthLabel && <p className="mt-1 text-sm text-los-text-secondary">{monthLabel}</p>}
        </div>
        {loading && <span className="text-[10px] text-los-ai animate-pulse shrink-0">Generating…</span>}
      </div>

      {error && review.source === 'rules' && (
        <div className="mt-4 rounded-lg border border-los-warning/40 bg-los-warning/10 px-3 py-2 text-xs text-los-warning">
          Gemini unavailable — showing offline review.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-4 border-los-border-ai bg-los-bg-card/80">
          <p className="los-ai-item-label mb-3">Monthly Trends</p>
          <TrendRow label="Productivity" trend={review.productivityTrend} />
          <TrendRow label="Life Score" trend={review.lifeScoreTrend} />
          <TrendRow label="Sleep" trend={review.sleepTrend} />
          <TrendRow label="Health" trend={review.healthTrend} />
        </Card>

        <div className="space-y-4">
          {review.characterGrowth.length > 0 && (
            <div className="los-ai-item">
              <p className="los-ai-item-label mb-3">Character Growth</p>
              <div className="flex flex-wrap gap-2">
                {review.characterGrowth.map((trait) => (
                  <span
                    key={trait.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-los-border-ai bg-los-bg-card px-3 py-1 text-sm"
                  >
                    <span className="font-medium text-los-text-primary">{trait.name}</span>
                    <span className="font-bold text-los-success tabular-nums">+{trait.change}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="los-ai-item border-los-border">
            <p className="los-section-label mb-1">Financial Progress</p>
            <p className="text-sm text-los-text-secondary leading-relaxed">{review.financialProgress.summary}</p>
            {review.financialProgress.monthPct != null && (
              <p className="mt-1 text-xs text-los-text-muted tabular-nums">
                Month: {review.financialProgress.monthPct > 0 ? '+' : ''}
                {review.financialProgress.monthPct}%
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="los-ai-item border-los-success/30 bg-los-success/5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-los-success">Most Improved</p>
              <p className="mt-1 text-sm text-los-text-primary leading-relaxed">{review.mostImprovedArea}</p>
            </div>
            <div className="los-ai-item border-los-warning/30 bg-los-warning/5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-los-warning">Needs Attention</p>
              <p className="mt-1 text-sm text-los-text-primary leading-relaxed">{review.areaNeedingAttention}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AIRecommendation label="AI Monthly Summary">{review.aiMonthlySummary}</AIRecommendation>
      </div>
    </AISurface>
  )
}
