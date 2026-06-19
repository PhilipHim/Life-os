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
    <section>
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {!hasData ? (
        <Card className="p-6">
          <p className="text-sm text-gray-400 text-center">{emptyMessage}</p>
        </Card>
      ) : (
        <>
          {children}
          {insights && insights.length > 0 && (
            <Card className="p-4 mt-3">
              <ul className="space-y-1.5">
                {insights.map((insight) => (
                  <li key={insight} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>
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
}

export function StatCard({ label, value, sublabel, trend, valueClassName = 'text-gray-900' }: StatCardProps) {
  return (
    <Card className="p-4">
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${valueClassName}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      {trend != null && (
        <p className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs last week
        </p>
      )}
    </Card>
  )
}

export function TrendBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-400">—</span>
  return (
    <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-500' : 'text-gray-900'}>
      {value > 0 ? '↑' : value < 0 ? '↓' : '→'} {Math.abs(value)}%
    </span>
  )
}
