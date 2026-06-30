'use client'

import type { ReactNode } from 'react'
import Card from '@/components/ui/Card'

interface AnalyticsSectionProps {
  title: string
  subtitle?: string
  children: ReactNode
  insights?: string[]
  emptyMessage?: string
  hasData?: boolean
}

export default function AnalyticsSection({
  title,
  subtitle,
  children,
  insights,
  emptyMessage = 'No data yet.',
  hasData = true,
}: AnalyticsSectionProps) {
  return (
    <section className="los-strategic-section">
      <div className="mb-5">
        <h2 className="font-heading text-xl font-semibold tracking-wide text-los-text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-los-text-secondary">{subtitle}</p>}
        <span className="los-strategic-section-rule" aria-hidden />
      </div>
      {!hasData ? (
        <Card className="p-6">
          <p className="text-sm text-los-text-muted text-center">{emptyMessage}</p>
        </Card>
      ) : (
        <>
          {children}
          {insights && insights.length > 0 && (
            <Card className="p-4 mt-3">
              <ul className="space-y-1.5">
                {insights.map((insight) => (
                  <li key={insight} className="flex items-start gap-2 text-sm text-los-text-secondary">
                    <span className="text-los-gold mt-0.5 shrink-0">◇</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </section>
  )
}

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  trend?: number | null
  valueClassName?: string
  highlight?: boolean
}

export function StatCard({
  label,
  value,
  sublabel,
  trend,
  valueClassName = 'text-los-text-primary',
  highlight = false,
}: StatCardProps) {
  return (
    <Card variant={highlight ? 'gold' : 'default'} className={`p-4 ${highlight ? '' : 'los-kpi-card'}`}>
      <p className="los-section-label">{label}</p>
      <p className={`text-2xl font-bold mt-2 tabular-nums ${valueClassName}`}>{value}</p>
      {sublabel && <p className="text-xs text-los-text-muted mt-1">{sublabel}</p>}
      {trend != null && (
        <p
          className={`text-xs font-medium mt-1.5 ${
            trend > 0 ? 'text-los-success' : trend < 0 ? 'text-los-danger' : 'text-los-text-muted'
          }`}
        >
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs last week
        </p>
      )}
    </Card>
  )
}

export function TrendBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-los-text-muted">—</span>
  return (
    <span className={value > 0 ? 'text-los-success' : value < 0 ? 'text-los-danger' : 'text-los-text-primary'}>
      {value > 0 ? '↑' : value < 0 ? '↓' : '→'} {Math.abs(value)}%
    </span>
  )
}

export function TrendHighlightCard({
  label,
  title,
  detail,
  tone = 'default',
}: {
  label: string
  title: string
  detail?: string
  tone?: 'success' | 'warning' | 'danger' | 'default' | 'ai'
}) {
  const labelColor =
    tone === 'success'
      ? 'text-los-success'
      : tone === 'warning'
        ? 'text-los-warning'
        : tone === 'danger'
          ? 'text-los-danger'
          : tone === 'ai'
            ? 'text-los-ai'
            : 'text-los-gold'

  return (
    <Card className="los-trend-highlight-card p-4">
      <p className={`text-[10px] font-semibold uppercase tracking-widest ${labelColor}`}>{label}</p>
      <p className="mt-1.5 text-lg font-bold text-los-text-primary">{title}</p>
      {detail && <p className="mt-1 text-sm text-los-text-muted">{detail}</p>}
    </Card>
  )
}
