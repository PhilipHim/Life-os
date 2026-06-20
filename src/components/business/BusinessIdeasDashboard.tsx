'use client'

import type { BusinessIdeasStats } from '@/lib/business-coach/types'
import Card from '@/components/ui/Card'

interface Props {
  stats: BusinessIdeasStats
  onSelectIdea?: (id: string) => void
}

export default function BusinessIdeasDashboard({ stats, onSelectIdea }: Props) {
  const kpis = [
    { label: 'Ideas Created', value: String(stats.ideasCreated) },
    { label: 'Ideas Analyzed', value: String(stats.ideasAnalyzed) },
    {
      label: 'Average Score',
      value: stats.averageScore != null ? `${stats.averageScore} / 100` : '—',
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">Business Dashboard</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{kpi.label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {(stats.highestScoringIdea || stats.mostPromisingIdea) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.highestScoringIdea && (
            <Card className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Highest Scoring Idea</p>
              <button
                type="button"
                onClick={() => onSelectIdea?.(stats.highestScoringIdea!.id)}
                className="mt-1 text-left w-full group"
              >
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                  {stats.highestScoringIdea.title}
                </p>
                <p className="text-xl font-bold tabular-nums text-emerald-600 mt-0.5">
                  {stats.highestScoringIdea.score} / 100
                </p>
              </button>
            </Card>
          )}
          {stats.mostPromisingIdea && (
            <Card className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Most Promising Idea</p>
              <button
                type="button"
                onClick={() => onSelectIdea?.(stats.mostPromisingIdea!.id)}
                className="mt-1 text-left w-full group"
              >
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                  {stats.mostPromisingIdea.title}
                </p>
                <p className="text-xl font-bold tabular-nums text-indigo-600 mt-0.5">
                  {stats.mostPromisingIdea.score.toFixed(1)} promising score
                </p>
              </button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
