'use client'

import type { MonthlyReview, ScoreTrend } from '@/lib/monthly-review/types'
import Card from '@/components/ui/Card'

const directionColor: Record<string, string> = {
  Improved: 'text-emerald-600',
  Declined: 'text-amber-600',
  Stable: 'text-gray-600',
  Unknown: 'text-gray-400',
}

function TrendRow({ label, trend }: { label: string; trend: ScoreTrend }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">{trend.summary}</p>
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
  return (
    <Card className="relative overflow-hidden ring-1 ring-violet-500/10 shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />
      <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-violet-50/60 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
              AI Monthly Review
              {review.source === 'gemini' && <span> · Gemini</span>}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 tracking-tight">Your Month in Review</h2>
            {monthLabel && <p className="mt-0.5 text-sm text-gray-500">{monthLabel}</p>}
          </div>
          {loading && (
            <span className="text-[10px] text-gray-400 animate-pulse shrink-0">Generating…</span>
          )}
        </div>

        {error && review.source === 'rules' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Gemini unavailable — showing offline review.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Monthly Trends</p>
            <TrendRow label="Productivity" trend={review.productivityTrend} />
            <TrendRow label="Life Score" trend={review.lifeScoreTrend} />
            <TrendRow label="Sleep" trend={review.sleepTrend} />
            <TrendRow label="Health" trend={review.healthTrend} />
          </div>

          <div className="space-y-4">
            {review.characterGrowth.length > 0 && (
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600 mb-3">Character Growth</p>
                <div className="flex flex-wrap gap-2">
                  {review.characterGrowth.map((trait) => (
                    <span
                      key={trait.name}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-violet-200 px-3 py-1 text-sm"
                    >
                      <span className="font-medium text-gray-800">{trait.name}</span>
                      <span className="font-bold text-emerald-600 tabular-nums">+{trait.change}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Financial Progress</p>
              <p className="text-sm text-gray-800 leading-relaxed">{review.financialProgress.summary}</p>
              {review.financialProgress.monthPct != null && (
                <p className="mt-1 text-xs text-gray-500 tabular-nums">
                  Month: {review.financialProgress.monthPct > 0 ? '+' : ''}{review.financialProgress.monthPct}%
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Most Improved</p>
                <p className="mt-1 text-sm text-gray-800 leading-relaxed">{review.mostImprovedArea}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">Needs Attention</p>
                <p className="mt-1 text-sm text-gray-800 leading-relaxed">{review.areaNeedingAttention}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-gray-900 to-violet-950 px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300">AI Monthly Summary</p>
          <p className="mt-2 text-sm text-white/95 leading-relaxed">{review.aiMonthlySummary}</p>
        </div>
      </div>
    </Card>
  )
}
