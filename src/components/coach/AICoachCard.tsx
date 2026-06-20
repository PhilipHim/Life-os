'use client'

import type { CoachReport, TrendDirection, TrendMetric } from '@/lib/coach/types'
import Card from '@/components/ui/Card'

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
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-amber-600'
  return 'text-gray-500'
}

function trendDirectionLabel(dir: TrendDirection): string {
  if (dir === 'declining') return 'Declining'
  if (dir === 'improving') return 'Improving'
  return 'Stable'
}

function trendDirectionColor(dir: TrendDirection, invert = false): string {
  if (dir === 'stable') return 'text-gray-500'
  const positive = dir === 'improving'
  const good = invert ? !positive : positive
  return good ? 'text-emerald-600' : 'text-amber-600'
}

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === 'improving') {
    return <span className="text-emerald-500 text-lg leading-none">↑</span>
  }
  if (direction === 'declining') {
    return <span className="text-amber-500 text-lg leading-none">↓</span>
  }
  return <span className="text-gray-400 text-lg leading-none">→</span>
}

function MiniTrendChart({ metric }: { metric: TrendMetric }) {
  const values = metric.values.length > 0 ? metric.values : [0]
  const max = Math.max(...values, 1)

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{metric.label}</p>
        <TrendArrow direction={metric.direction} />
      </div>

      <div className="mt-3 flex items-end gap-1.5 h-10">
        {values.map((v, i) => (
          <div key={`${metric.label}-${i}`} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-gray-900/80 transition-all"
              style={{ height: `${Math.max((v / max) * 100, 8)}%`, minHeight: 4 }}
            />
            <span className="text-[10px] tabular-nums text-gray-500">{v > 0 ? v : '—'}</span>
          </div>
        ))}
      </div>

      <p className={`mt-2 text-xs font-semibold ${trendDirectionColor(metric.direction)}`}>
        {trendDirectionLabel(metric.direction)}
      </p>
    </div>
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
      {/* Section 1: Today's Biggest Lever */}
      <Card className="relative overflow-hidden ring-1 ring-indigo-500/10 shadow-lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-50/80 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI Coach</h2>
                <p className="text-xs text-gray-500">
                  Personal Life OS advisor
                  {poweredByGemini && <span className="text-indigo-500"> · Gemini</span>}
                </p>
              </div>
            </div>
            {loading && (
              <span className="text-[10px] text-gray-400 animate-pulse shrink-0">Updating…</span>
            )}
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Today&apos;s Biggest Lever</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">{biggestLever.title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-2xl">{biggestLever.context}</p>

            {biggestLever.impactAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Improving this is most likely to improve:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {biggestLever.impactAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      + {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-gray-900 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Today&apos;s Action</p>
              <p className="mt-1 text-sm font-semibold text-white">{biggestLever.todaysAction}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: Trend Analysis */}
      {daily.trends.length > 0 && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">Trend Analysis</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {daily.trends.map((metric) => (
              <MiniTrendChart key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings + Insights row */}
      {(daily.warnings.length > 0 || daily.insights.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {daily.warnings.length > 0 && (
            <Card className="border-amber-100 bg-amber-50/30">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-3">Warnings</p>
              <ul className="space-y-2.5">
                {daily.warnings.map((w) => (
                  <li key={w.id} className="flex gap-2 text-sm text-amber-950">
                    <span className="shrink-0 text-amber-500">!</span>
                    {w.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {daily.insights.length > 0 && (
            <Card>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Insights</p>
              <ul className="space-y-2.5">
                {daily.insights.map((ins) => (
                  <li key={ins.id} className="flex gap-2 text-sm text-gray-700">
                    <span className="shrink-0 text-indigo-400">◆</span>
                    {ins.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Section 4: Character Coach */}
      {daily.characterCoach.length > 0 && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">Character Coach</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daily.characterCoach.map((trait) => (
              <Card key={trait.name} className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{trait.name}</h4>
                  <span className="text-xs text-gray-400">Level {trait.level}</span>
                </div>
                <p className="mt-3 text-xs text-gray-500 uppercase tracking-wider">Recommendation</p>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">{trait.recommendation}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Weekly Review */}
      {weekly && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gray-200" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Weekly Review</h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {weekly.metrics.slice(0, 4).map((metric) => (
              <div key={metric.label} className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{metric.label}</p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${trendColor(metric.value)}`}>
                  {formatTrend(metric.value, metric.unit)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {weekly.bestImprovement && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Best Improvement</p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">{weekly.bestImprovement}</p>
              </div>
            )}
            {weekly.weakestArea && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">Weakest Area</p>
                <p className="mt-1 text-sm font-semibold text-amber-900">{weekly.weakestArea}</p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Summary</p>
            <p className="mt-2 text-base font-medium text-gray-900 leading-relaxed">{weekly.summary}</p>
            <p className="mt-2 text-sm text-indigo-700 font-medium">{weekly.nextWeekFocus}</p>
          </div>

          {weekly.characterChanges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {weekly.characterChanges.map((trait) => (
                <span
                  key={trait.name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-gray-700">{trait.name}</span>
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
