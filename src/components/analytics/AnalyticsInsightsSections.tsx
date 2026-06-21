'use client'

import type { Trend30DayMetric, PersonalInsight, PatternObservation } from '@/lib/analytics-insights'
import Card from '@/components/ui/Card'
import MiniBarChart from '@/components/analytics/MiniBarChart'
import AnalyticsSection, { TrendBadge } from '@/components/analytics/AnalyticsSection'

const directionColor: Record<string, string> = {
  Improved: 'text-emerald-600',
  Declined: 'text-amber-600',
  Stable: 'text-gray-600',
  Unknown: 'text-gray-400',
}

function Trend30DayCard({ metric }: { metric: Trend30DayMetric }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{metric.label}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Current (30d avg)</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900">
            {metric.current != null ? metric.current : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Previous (30d)</p>
          <p className="text-lg font-semibold tabular-nums text-gray-500">
            {metric.previous != null ? metric.previous : '—'}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={`text-sm font-semibold ${directionColor[metric.direction]}`}>
          {metric.direction}
        </span>
        {metric.changePct != null && <TrendBadge value={metric.changePct} />}
      </div>

      {metric.chartData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <MiniBarChart data={metric.chartData} max={100} height={64} />
        </div>
      )}

      {!metric.hasData && (
        <p className="mt-3 text-xs text-gray-400">Not enough data in the last 30 days.</p>
      )}
    </Card>
  )
}

export function Trends30DaySection({ trends }: { trends: Trend30DayMetric[] }) {
  return (
    <AnalyticsSection title="30 Day Trends" subtitle="Last 30 days vs previous 30 days">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trends.map((t) => (
          <Trend30DayCard key={t.label} metric={t} />
        ))}
      </div>
    </AnalyticsSection>
  )
}

export function PersonalInsightsCard({ insights }: { insights: PersonalInsight[] }) {
  return (
    <AnalyticsSection title="Personal Insights" subtitle="Highlights from your last 30 days">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-gray-900 leading-relaxed">{item.value}</p>
          </Card>
        ))}
      </div>
    </AnalyticsSection>
  )
}

export function PatternDetectionCard({ patterns }: { patterns: PatternObservation[] }) {
  return (
    <AnalyticsSection title="Pattern Detection" subtitle="Observations from your data">
      <Card className="p-5">
        <ul className="space-y-3">
          {patterns.map((p) => (
            <li key={p.id} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                ◆
              </span>
              <span className="leading-relaxed">{p.message}</span>
            </li>
          ))}
        </ul>
      </Card>
    </AnalyticsSection>
  )
}
