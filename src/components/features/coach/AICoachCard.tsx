'use client'

import type { CoachReport, TrendDirection, TrendMetric } from '@/lib/coach/types'
import Card from '@/components/ui/Card'
import AISurface, { AIBadge, AIRecommendation } from '@/components/features/strategic/AISurface'
import { StrategicSubheading } from '@/components/features/strategic/StrategicSection'
import MiniBarChart from '@/components/features/analytics/MiniBarChart'

function formatTrend(value: number, unit: 'percent' | 'level' | 'score'): string {
  if (unit === 'percent') {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value}%`
  }
  if (unit === 'level') {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}`
  }
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}`
}

function trendColor(value: number): string {
  if (value > 0) return 'text-los-success'
  if (value < 0) return 'text-los-warning'
  return 'text-los-text-muted'
}

function trendDirectionLabel(dir: TrendDirection): string {
  if (dir === 'declining') return 'Declining'
  if (dir === 'improving') return 'Improving'
  return 'Stable'
}

function trendDirectionColor(dir: TrendDirection): string {
  if (dir === 'stable') return 'text-los-text-muted'
  if (dir === 'improving') return 'text-los-success'
  return 'text-los-warning'
}

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === 'improving') return <span className="text-los-success text-lg leading-none">↑</span>
  if (direction === 'declining') return <span className="text-los-warning text-lg leading-none">↓</span>
  return <span className="text-los-text-muted text-lg leading-none">→</span>
}

function MiniTrendChart({ metric }: { metric: TrendMetric }) {
  const values = metric.values.length > 0 ? metric.values : [0]

  return (
    <Card className="p-4 los-kpi-card">
      <div className="flex items-center justify-between">
        <p className="los-section-label">{metric.label}</p>
        <TrendArrow direction={metric.direction} />
      </div>
      <div className="mt-3">
        <MiniBarChart
          data={values.map((v, i) => ({ label: String(i + 1), value: v }))}
          max={Math.max(...values, 1)}
          variant="ai"
          height={48}
        />
      </div>
      <p className={`mt-2 text-xs font-semibold ${trendDirectionColor(metric.direction)}`}>
        {trendDirectionLabel(metric.direction)}
      </p>
    </Card>
  )
}

interface AICoachCardProps {
  report: CoachReport
  loading?: boolean
  poweredByGemini?: boolean
}

export default function AICoachCard({ report, loading, poweredByGemini }: AICoachCardProps) {
  const { daily, weekly } = report
  const { biggestLever } = daily

  return (
    <div className="space-y-6">
      <AISurface padding="lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-los-border-ai bg-los-ai/15 text-los-ai">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold tracking-wide text-los-text-primary">AI Coach</h2>
              <AIBadge label="Personal ASCEND advisor" poweredByGemini={poweredByGemini} />
            </div>
          </div>
          {loading && <span className="text-[10px] text-los-ai animate-pulse shrink-0">Updating…</span>}
        </div>

        <div className="mt-6">
          <p className="los-ai-badge">Today&apos;s Biggest Lever</p>
          <h3 className="mt-2 font-heading text-2xl font-bold tracking-wide text-los-text-primary">
            {biggestLever.title}
          </h3>
          <p className="mt-2 text-sm text-los-text-secondary leading-relaxed max-w-2xl">{biggestLever.context}</p>

          {biggestLever.impactAreas.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-los-text-muted">Improving this is most likely to improve:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {biggestLever.impactAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center rounded-full border border-los-border-ai bg-los-ai/10 px-2.5 py-1 text-xs font-medium text-los-ai-light"
                  >
                    + {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <AIRecommendation label="Today's Action">{biggestLever.todaysAction}</AIRecommendation>
          </div>
        </div>
      </AISurface>

      {daily.trends.length > 0 && (
        <div>
          <StrategicSubheading>Trend Analysis</StrategicSubheading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {daily.trends.map((metric) => (
              <MiniTrendChart key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {(daily.warnings.length > 0 || daily.insights.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {daily.warnings.length > 0 && (
            <Card className="p-4 border-los-warning/35 bg-los-warning/5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-los-warning mb-3">Warnings</p>
              <ul className="space-y-2.5">
                {daily.warnings.map((w) => (
                  <li key={w.id} className="flex gap-2 text-sm text-los-text-primary">
                    <span className="shrink-0 text-los-warning">!</span>
                    {w.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {daily.insights.length > 0 && (
            <Card className="p-4 border-los-border-ai bg-los-ai/5">
              <p className="los-ai-item-label mb-3">Insights</p>
              <ul className="space-y-2.5">
                {daily.insights.map((ins) => (
                  <li key={ins.id} className="flex gap-2 text-sm text-los-text-secondary">
                    <span className="shrink-0 text-los-ai">◆</span>
                    {ins.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {daily.characterCoach.length > 0 && (
        <div>
          <StrategicSubheading>Character Coach</StrategicSubheading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daily.characterCoach.map((trait) => (
              <Card key={trait.name} className="p-4 los-kpi-card">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-los-text-primary">{trait.name}</h4>
                  <span className="text-xs text-los-text-muted">Level {trait.level}</span>
                </div>
                <p className="mt-3 los-section-label">Recommendation</p>
                <p className="mt-1 text-sm text-los-text-secondary leading-relaxed">{trait.recommendation}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {weekly && (
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-los-gold to-transparent opacity-60" />
          <StrategicSubheading>Weekly Review</StrategicSubheading>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {weekly.metrics.slice(0, 4).map((metric) => (
              <div key={metric.label} className="rounded-lg border border-los-border bg-los-bg-secondary/50 px-4 py-3">
                <p className="los-section-label">{metric.label}</p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${trendColor(metric.value)}`}>
                  {formatTrend(metric.value, metric.unit)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {weekly.bestImprovement && (
              <div className="rounded-lg border border-los-success/30 bg-los-success/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-los-success">Best Improvement</p>
                <p className="mt-1 text-sm font-semibold text-los-text-primary">{weekly.bestImprovement}</p>
              </div>
            )}
            {weekly.weakestArea && (
              <div className="rounded-lg border border-los-warning/30 bg-los-warning/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-los-warning">Weakest Area</p>
                <p className="mt-1 text-sm font-semibold text-los-text-primary">{weekly.weakestArea}</p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-los-border-subtle">
            <p className="los-section-label">AI Summary</p>
            <p className="mt-2 text-base font-medium text-los-text-primary leading-relaxed">{weekly.summary}</p>
            <p className="mt-2 text-sm text-los-ai font-medium">{weekly.nextWeekFocus}</p>
          </div>

          {weekly.characterChanges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {weekly.characterChanges.map((trait) => (
                <span
                  key={trait.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-los-border bg-los-bg-card px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-los-text-secondary">{trait.name}</span>
                  <span className={`font-bold tabular-nums ${trendColor(trait.change)}`}>
                    {formatTrend(trait.change, 'level')}
                  </span>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
