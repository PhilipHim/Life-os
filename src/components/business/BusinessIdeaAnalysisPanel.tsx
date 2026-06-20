'use client'

import type { BusinessIdeaAnalysis } from '@/lib/types'
import Card from '@/components/ui/Card'

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums text-gray-900 w-8 text-right">{score}/{max}</span>
    </div>
  )
}

function SectionBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
      {children}
    </div>
  )
}

interface Props {
  analysis: BusinessIdeaAnalysis
  ideaTitle: string
  onConvertToProject?: () => void
  poweredByGemini?: boolean
}

export default function BusinessIdeaAnalysisPanel({
  analysis,
  ideaTitle,
  onConvertToProject,
  poweredByGemini,
}: Props) {
  return (
    <Card className="relative overflow-hidden ring-1 ring-violet-500/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">
            Business Analysis{poweredByGemini ? ' · Gemini' : ''}
          </p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">{ideaTitle}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Analyzed {new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-center shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Overall Score</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900 leading-none mt-1">
            {analysis.overallScore}
            <span className="text-lg font-normal text-gray-400"> / 100</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionBlock title="Market Potential">
          <ScoreBar score={analysis.marketPotential.score} />
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{analysis.marketPotential.explanation}</p>
        </SectionBlock>

        <SectionBlock title="Monetization">
          <ScoreBar score={analysis.monetization.score} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {analysis.monetization.models.map((m) => (
              <span key={m} className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {m}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{analysis.monetization.explanation}</p>
        </SectionBlock>

        <SectionBlock title="Difficulty">
          <ScoreBar score={analysis.difficulty.score} />
          <p className="mt-2 text-sm text-gray-600"><span className="font-medium text-gray-700">Technical: </span>{analysis.difficulty.technicalExplanation}</p>
          <p className="mt-1 text-sm text-gray-600"><span className="font-medium text-gray-700">Operational: </span>{analysis.difficulty.operationalExplanation}</p>
        </SectionBlock>

        <SectionBlock title="Competition">
          <p className={`text-2xl font-bold ${
            analysis.competition.level === 'High' ? 'text-amber-600' :
            analysis.competition.level === 'Low' ? 'text-emerald-600' : 'text-gray-700'
          }`}>
            {analysis.competition.level}
          </p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{analysis.competition.explanation}</p>
        </SectionBlock>

        <SectionBlock title="Time to MVP">
          <p className="text-xl font-bold text-gray-900">{analysis.timeToMvp.estimate}</p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{analysis.timeToMvp.explanation}</p>
        </SectionBlock>

        <SectionBlock title="Biggest Risk">
          <p className="text-sm font-semibold text-amber-800">{analysis.biggestRisk.type}</p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{analysis.biggestRisk.explanation}</p>
        </SectionBlock>
      </div>

      <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Next Step</p>
        <p className="mt-1.5 text-sm font-semibold text-indigo-950">{analysis.nextStep}</p>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">MVP Roadmap</p>
        <ol className="space-y-2">
          {analysis.mvpRoadmap.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {onConvertToProject && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onConvertToProject}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Convert to Work Project
          </button>
          <p className="mt-2 text-xs text-center text-gray-400">
            Roadmap steps become actionable work items in a project group
          </p>
        </div>
      )}
    </Card>
  )
}
