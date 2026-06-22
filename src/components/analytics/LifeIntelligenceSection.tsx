'use client'

import type { LifeIntelligenceReport } from '@/lib/life-intelligence'
import Card from '@/components/ui/Card'
import { StatCard, TrendBadge } from '@/components/analytics/AnalyticsSection'

const trendStyles = {
  improving: { label: 'Improving', className: 'text-emerald-600 bg-emerald-50' },
  declining: { label: 'Declining', className: 'text-amber-700 bg-amber-50' },
  stable: { label: 'Stable', className: 'text-gray-600 bg-gray-100' },
} as const

function SubHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function LifeIntelligenceSection({ report }: { report: LifeIntelligenceReport }) {
  if (!report.hasData) {
    return (
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Life Intelligence
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Pattern discovery from your productivity, health, habits, and journal data
          </p>
        </div>
        <Card className="p-8 text-center ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-500">
            Log at least 3 days of activity across tasks, habits, sleep, or health to unlock
            personalized intelligence.
          </p>
          {report.dataDays > 0 && (
            <p className="text-xs text-gray-400 mt-2">{report.dataDays} active days recorded so far.</p>
          )}
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Life Intelligence
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Discovered from {report.dataDays} days of your Life OS data — not generic advice
        </p>
      </div>

      <Card className="relative overflow-hidden p-6 ring-1 ring-gray-900/5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400" />

        {report.personalInsights.length > 0 && (
          <div className="mb-8">
            <SubHeading title="Personal Insights" subtitle="What your data says about you" />
            <div className="grid gap-3 sm:grid-cols-2">
              {report.personalInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3"
                >
                  <p className="text-sm text-gray-800 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.bestPerformance.length > 0 && (
          <div className="mb-8">
            <SubHeading title="Best Performance" subtitle="Peaks across your tracked history" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {report.bestPerformance.map((peak) => (
                <StatCard
                  key={`${peak.label}-${peak.date}`}
                  label={peak.label}
                  value={String(peak.value)}
                  sublabel={`${peak.displayDate} · ${peak.unit}`}
                  valueClassName="text-gray-900"
                />
              ))}
            </div>
          </div>
        )}

        {report.weakestAreas.length > 0 && (
          <div className="mb-8">
            <SubHeading title="Weakest Areas" subtitle="Where friction shows up most often" />
            <div className="grid gap-3 sm:grid-cols-2">
              {report.weakestAreas.map((area) => (
                <Card key={area.id} className="p-4 border-l-4 border-l-amber-400">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                    {area.label}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-700">{area.detail}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {report.trends.length > 0 && (
          <div className="mb-8">
            <SubHeading title="Trend Detection" subtitle="Direction over the last 2–3 weeks" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.trends.map((trend) => {
                const style = trendStyles[trend.direction]
                return (
                  <Card key={trend.id} className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        {trend.metric}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.className}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{trend.message}</p>
                    {trend.changePct != null && (
                      <p className="mt-2 text-xs text-gray-500">
                        Change: <TrendBadge value={trend.changePct} />
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {report.patterns.length > 0 && (
          <div className="mb-8">
            <SubHeading title="Pattern Discovery" subtitle="Relationships in your behavior" />
            <div className="space-y-2">
              {report.patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="rounded-lg border border-gray-200 px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {pattern.cause} → {pattern.effect}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">{pattern.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.recommendations.length > 0 && (
          <div>
            <SubHeading title="Smart Recommendations" subtitle="Actions tied to your patterns" />
            <div className="space-y-3">
              {report.recommendations.map((rec) => (
                <Card key={rec.id} className="p-4 bg-gray-50 border-gray-200">
                  <p className="text-xs text-gray-500 mb-1.5">Based on: {rec.basedOn}</p>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {rec.recommendation}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}
