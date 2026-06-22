'use client'

import type { LifeIntelligenceReport } from '@/lib/life-intelligence'
import Card from '@/components/ui/Card'
import { StatCard, TrendBadge } from '@/components/analytics/AnalyticsSection'
import { CompassIcon } from '@/design-system/icons'

const trendStyles = {
  improving: { label: 'Improving', className: 'text-los-success bg-los-success/10 border-los-success/30' },
  declining: { label: 'Declining', className: 'text-los-warning bg-los-warning/10 border-los-warning/30' },
  stable: { label: 'Stable', className: 'text-los-text-secondary bg-los-bg-secondary border-los-border' },
} as const

function SubHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="los-section-label">{title}</h3>
      {subtitle && <p className="text-xs text-los-text-muted mt-1">{subtitle}</p>}
    </div>
  )
}

export default function LifeIntelligenceSection({ report }: { report: LifeIntelligenceReport }) {
  if (!report.hasData) {
    return (
      <section className="los-strategic-section">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <CompassIcon size={18} className="text-los-gold" />
            <h2 className="font-heading text-xl font-semibold tracking-wide text-los-text-primary">
              Life Intelligence
            </h2>
          </div>
          <p className="mt-1 text-sm text-los-text-secondary">
            Pattern discovery from your productivity, health, habits, and journal data
          </p>
          <span className="los-strategic-section-rule" aria-hidden />
        </div>
        <Card className="p-8 text-center">
          <p className="text-sm text-los-text-secondary">
            Log at least 3 days of activity across tasks, habits, sleep, or health to unlock personalized
            intelligence.
          </p>
          {report.dataDays > 0 && (
            <p className="text-xs text-los-text-muted mt-2">{report.dataDays} active days recorded so far.</p>
          )}
        </Card>
      </section>
    )
  }

  return (
    <section className="los-strategic-section space-y-0">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <CompassIcon size={18} className="text-los-gold" />
          <h2 className="font-heading text-xl font-semibold tracking-wide text-los-text-primary">
            Life Intelligence
          </h2>
        </div>
        <p className="mt-1 text-sm text-los-text-secondary">
          Discovered from {report.dataDays} days of your Life OS data — not generic advice
        </p>
        <span className="los-strategic-section-rule" aria-hidden />
      </div>

      <Card className="relative overflow-hidden p-6 los-intelligence-surface">
        {report.personalInsights.length > 0 && (
          <div className="mb-8">
            <SubHeading title="Personal Insights" subtitle="What your data says about you" />
            <div className="grid gap-3 sm:grid-cols-2">
              {report.personalInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-los-border-gold/40 bg-los-gold/5 px-4 py-3"
                >
                  <p className="text-sm text-los-text-primary leading-relaxed">{insight.text}</p>
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
                  highlight
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
                <Card key={area.id} className="p-4 los-insight-card--neutral">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-los-warning">
                    {area.label}
                  </p>
                  <p className="mt-1.5 text-sm text-los-text-secondary">{area.detail}</p>
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
                  <Card key={trend.id} className="p-4 los-kpi-card">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="los-section-label">{trend.metric}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.className}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-sm text-los-text-secondary leading-relaxed">{trend.message}</p>
                    {trend.changePct != null && (
                      <p className="mt-2 text-xs text-los-text-muted">
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
                <div key={pattern.id} className="rounded-lg border border-los-border px-4 py-3 bg-los-bg-secondary/40">
                  <p className="los-section-label">
                    {pattern.cause} → {pattern.effect}
                  </p>
                  <p className="mt-1 text-sm text-los-text-secondary leading-relaxed">{pattern.message}</p>
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
                <Card key={rec.id} className="p-4 border-los-border-gold bg-los-gold/5">
                  <p className="text-xs text-los-text-muted mb-1.5">Based on: {rec.basedOn}</p>
                  <p className="text-sm font-medium text-los-text-primary leading-relaxed">{rec.recommendation}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}
