'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useWorkItems } from '@/lib/WorkItemContext'
import { useFocus } from '@/lib/FocusContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { formatFocusTime } from '@/lib/focus'
import { computeProductivityScore, generateProductivityInsights, type ProductivityScore } from '@/lib/productivity-score'
import { useHabits } from '@/lib/HabitContext'
import { getInsights } from '@/lib/insights'
import { getWeeklyReport, type WeeklyReport } from '@/lib/weekly'
import { computeLifeScore } from '@/lib/life-score'
import type { LifeScoreResult } from '@/lib/life-score'
import { getSleepEntryByDate } from '@/lib/db/sleep'
import { getHealthEntryByDate } from '@/lib/db/health'
import { getHealthEvents, computeHealthStatus } from '@/lib/db/health-illness'
import { getJournalEntryByDate } from '@/lib/db/journal'
import { computeHealthScore } from '@/lib/health-score'
import { getCharacterAreas } from '@/lib/db/character'
import {
  getAssets,
  getWatchlistAssets,
  computeAggregatedPerformance,
  computeStockPerformance,
} from '@/lib/db/finance'
import type { CharacterArea, JournalEntry } from '@/lib/types'
import Card from '@/components/ui/Card'

const PRIORITY_ORDER: Record<string, number> = { H1: 0, H2: 1, M: 2, L: 3 }

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function BreakDownRow({
  label,
  score,
  max,
  percentage,
}: {
  label: string
  score: number
  max: number
  percentage: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium tabular-nums">
          {score}<span className="text-gray-400 font-normal"> / {max}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

function SectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function CompactKpiCard({
  label,
  metric,
  sublabel,
  progress,
  href,
}: {
  label: string
  metric: string
  sublabel?: string
  progress?: number
  href: string
}) {
  return (
    <Link href={href} className="block group">
      <Card className="p-4 transition-all duration-200 group-hover:border-gray-300 group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer h-full">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">{metric}</p>
        {sublabel && <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>}
        {progress !== undefined && (
          <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </Card>
    </Link>
  )
}

function isJournalCompletedToday(entry: JournalEntry | undefined): boolean {
  if (!entry) return false
  const hasText = [
    entry.gratitude,
    entry.intentions,
    entry.affirmations,
    entry.wins,
    entry.lessonsLearned,
    entry.reflection,
    entry.tomorrowFocus,
  ].some((t) => t.trim().length > 0)
  return hasText || entry.updatedAt > entry.createdAt
}

function computeFocusStreak(sessionDates: Set<string>): number {
  const d = new Date()
  const todayStr = todayLocal()
  if (!sessionDates.has(todayStr)) {
    d.setDate(d.getDate() - 1)
  }
  let streak = 0
  while (true) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (sessionDates.has(ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export default function DashboardPage() {
  const { workItems } = useWorkItems()
  const { focusSessions, activeSession } = useFocus()
  const { planItems, todayPlan } = useDailyPlan()
  const { buildDone, buildTotal, avoidSuccess, avoidTotal } = useHabits()
  const todayHabitsDone = buildDone + avoidSuccess
  const todayHabitsTotal = buildTotal + avoidTotal
  const [insights, setInsights] = useState<ReturnType<typeof getInsights>>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [characterAreas, setCharacterAreas] = useState<CharacterArea[]>([])

  const todayStr = todayLocal()

  useEffect(() => {
    setInsights(getInsights())
    setWeeklyReport(getWeeklyReport())
    setCharacterAreas(getCharacterAreas())
  }, [workItems, focusSessions, planItems])

  const habitStats = useMemo(() => ({
    completed: todayHabitsDone,
    total: todayHabitsTotal,
  }), [todayHabitsDone, todayHabitsTotal])

  const productivityScore = useMemo<ProductivityScore>(() =>
    computeProductivityScore(planItems, workItems, focusSessions, habitStats),
    [planItems, workItems, focusSessions, habitStats]
  )

  const lifeScore = useMemo<LifeScoreResult | null>(() =>
    computeLifeScore(new Date(), {
      plannerCompletionPct: productivityScore.planner.percentage,
      focusMinutes: productivityScore.focus.totalMinutes,
      buildDone, buildTotal, avoidSuccess, avoidTotal,
    }),
    [productivityScore, buildDone, buildTotal, avoidSuccess, avoidTotal]
  )

  const todayInsights = useMemo(() =>
    generateProductivityInsights(productivityScore, planItems, workItems),
    [productivityScore, planItems, workItems]
  )

  const allInsights = useMemo(() => {
    const seen = new Set<string>()
    const merged: { type: 'positive' | 'negative' | 'neutral'; title: string; description: string }[] = []
    for (const i of [...todayInsights, ...insights]) {
      const key = i.title + '|' + i.description
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(i)
      }
    }
    return merged
  }, [todayInsights, insights])

  const lifeOsSnapshot = useMemo(() => {
    const sleepEntry = getSleepEntryByDate(todayStr)
    const healthEntry = getHealthEntryByDate(todayStr)
    const journalEntry = getJournalEntryByDate(todayStr)
    const healthStatus = computeHealthStatus(getHealthEvents(), todayStr)

    const assets = getAssets()
    const watchlist = getWatchlistAssets()
    const portfolioPerf = computeAggregatedPerformance(assets)

    let bestAsset: { symbol: string; pct: number } | null = null
    let worstAsset: { symbol: string; pct: number } | null = null
    for (const asset of assets) {
      const { dailyChangePct } = computeStockPerformance(asset)
      if (!bestAsset || dailyChangePct > bestAsset.pct) {
        bestAsset = { symbol: asset.symbol, pct: dailyChangePct }
      }
      if (!worstAsset || dailyChangePct < worstAsset.pct) {
        worstAsset = { symbol: asset.symbol, pct: dailyChangePct }
      }
    }

    return {
      sleepScore: sleepEntry?.sleepScore ?? null,
      healthScore: healthEntry ? computeHealthScore(healthEntry).total : null,
      daysWithoutIllness: healthStatus.status === 'healthy' ? healthStatus.streakDays : 0,
      isSick: healthStatus.status === 'sick',
      journalCompleted: isJournalCompletedToday(journalEntry),
      portfolioDailyPct: portfolioPerf.dailyChangePct,
      bestAsset,
      worstAsset,
      watchlistCount: watchlist.length,
      portfolioCount: assets.length,
    }
  }, [todayStr, workItems, focusSessions, planItems])

  const habitRate = todayHabitsTotal > 0 ? Math.round((todayHabitsDone / todayHabitsTotal) * 100) : 0

  const dailyFocus = useMemo(() => {
    const sortedPlan = [...todayPlan].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    })

    const isComplete = (workItemId: string) => {
      const wi = workItems.find((w) => w.id === workItemId)
      return wi?.status === 'completed'
    }

    const activeTaskTitle = activeSession?.taskTitle ?? null

    const firstIncomplete = sortedPlan.find((pi) => !isComplete(pi.workItemId))
    const currentTask = activeTaskTitle
      ?? (firstIncomplete
        ? workItems.find((w) => w.id === firstIncomplete.workItemId)?.title ?? 'Unknown task'
        : null)

    const nextHighPriority = sortedPlan.find((pi) => {
      if (isComplete(pi.workItemId)) return false
      if (activeSession && pi.workItemId === activeSession.session.workItemId) return false
      if (firstIncomplete && pi.id === firstIncomplete.id && !activeSession) return false
      return pi.priority === 'H1' || pi.priority === 'H2'
    })
    const nextTaskTitle = nextHighPriority
      ? workItems.find((w) => w.id === nextHighPriority.workItemId)?.title ?? null
      : null

    const focusDates = new Set(
      focusSessions.filter((s) => s.duration > 0).map((s) => s.date)
    )
    const focusStreak = computeFocusStreak(focusDates)

    const plannerCompletion = productivityScore.planner.percentage

    return { currentTask, nextTaskTitle, focusStreak, plannerCompletion }
  }, [todayPlan, workItems, activeSession, focusSessions, productivityScore.planner.percentage])

  const topCharacterTraits = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return [...characterAreas]
      .sort((a, b) => b.level - a.level)
      .slice(0, 3)
      .map((area) => ({
        ...area,
        updatedThisWeek: area.updatedAt >= weekAgo,
      }))
  }, [characterAreas])

  const characterWeeklyTrend = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const activeCount = characterAreas.filter((a) => a.updatedAt >= weekAgo).length
    return activeCount
  }, [characterAreas])

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Command Center</h1>
        <p className="text-base text-gray-500">Your Life OS overview — productivity, health, and daily progress at a glance</p>
      </div>

      {/* SECTION 1: Hero Scores */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden ring-1 ring-gray-900/5 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gray-900" />
          <div className="text-center pt-2">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Productivity Score</p>
            <p className="mt-3 text-7xl font-bold text-gray-900 tabular-nums leading-none">
              {productivityScore.total}
              <span className="text-3xl font-normal text-gray-400"> / 100</span>
            </p>
            <div className="mt-4 h-2.5 rounded-full bg-gray-100 overflow-hidden max-w-sm mx-auto">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
                style={{ width: `${productivityScore.total}%` }}
              />
            </div>
            <div className="mt-6 space-y-2.5 max-w-sm mx-auto text-left">
              <BreakDownRow label="Planner" score={productivityScore.planner.score} max={productivityScore.planner.max} percentage={productivityScore.planner.percentage} />
              <BreakDownRow label="Priority" score={productivityScore.priority.score} max={productivityScore.priority.max} percentage={productivityScore.priority.percentage} />
              <BreakDownRow label="Focus" score={productivityScore.focus.score} max={productivityScore.focus.max} percentage={productivityScore.focus.percentage} />
              <BreakDownRow label="Habits" score={productivityScore.habits.score} max={productivityScore.habits.max} percentage={productivityScore.habits.percentage} />
            </div>
          </div>
        </Card>

        {lifeScore && (
          <Card className="relative overflow-hidden ring-1 ring-gray-900/5 shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-gray-400" />
            <div className="text-center pt-2">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Life Score</p>
              <p className="mt-3 text-7xl font-bold text-gray-900 tabular-nums leading-none">
                {lifeScore.total}
                <span className="text-3xl font-normal text-gray-400"> / {lifeScore.max}</span>
              </p>
              <div className="mt-4 h-2.5 rounded-full bg-gray-100 overflow-hidden max-w-sm mx-auto">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
                  style={{ width: `${lifeScore.total}%` }}
                />
              </div>
              <div className="mt-6 space-y-2.5 max-w-sm mx-auto text-left">
                <BreakDownRow label="Productivity" score={lifeScore.productivity} max={lifeScore.max} percentage={lifeScore.productivity} />
                <BreakDownRow label="Health" score={lifeScore.health ?? 0} max={lifeScore.max} percentage={lifeScore.health ?? 0} />
                <BreakDownRow label="Mind" score={lifeScore.mind} max={lifeScore.max} percentage={lifeScore.mind} />
                <BreakDownRow label="Habits" score={lifeScore.habits} max={lifeScore.max} percentage={lifeScore.habits} />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* SECTION 2: Today Overview */}
      <div>
        <SectionHeading title="Today Overview" href="/life-os" linkLabel="Open Life OS" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <CompactKpiCard
            label="Sleep Score"
            metric={lifeOsSnapshot.sleepScore != null ? String(lifeOsSnapshot.sleepScore) : '—'}
            sublabel={lifeOsSnapshot.sleepScore != null ? 'Logged today' : 'Not logged'}
            href="/life-os"
          />
          <CompactKpiCard
            label="Health Score"
            metric={lifeOsSnapshot.healthScore != null ? String(lifeOsSnapshot.healthScore) : '—'}
            sublabel={lifeOsSnapshot.healthScore != null ? 'Logged today' : 'Not logged'}
            href="/life-os"
          />
          <CompactKpiCard
            label="Days Without Illness"
            metric={lifeOsSnapshot.isSick ? '0' : String(lifeOsSnapshot.daysWithoutIllness)}
            sublabel={lifeOsSnapshot.isSick ? 'Currently sick' : 'Healthy streak'}
            href="/life-os"
          />
          <CompactKpiCard
            label="Journal Today"
            metric={lifeOsSnapshot.journalCompleted ? 'Done' : '—'}
            sublabel={lifeOsSnapshot.journalCompleted ? 'Entry saved' : 'Not completed'}
            href="/life-os"
          />
          <CompactKpiCard
            label="Habits Today"
            metric={todayHabitsTotal > 0 ? `${habitRate}%` : '—'}
            sublabel={todayHabitsTotal > 0 ? `${todayHabitsDone}/${todayHabitsTotal} done` : 'No habits'}
            progress={habitRate}
            href="/habits/today"
          />
        </div>
      </div>

      {/* SECTION 3: Daily Focus */}
      <div>
        <SectionHeading title="Daily Focus" href="/plan" linkLabel="Open Planner" />
        <Card>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Active Task</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900 truncate">
                {dailyFocus.currentTask ?? 'None in focus'}
              </p>
              {activeSession && (
                <p className="mt-0.5 text-xs text-green-600 font-medium">In focus now</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Next Priority</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900 truncate">
                {dailyFocus.nextTaskTitle ?? 'No high-priority items'}
              </p>
              <Link href="/work" className="mt-0.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                View work items →
              </Link>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Focus Streak</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
                {dailyFocus.focusStreak}
                <span className="text-sm font-normal text-gray-400"> days</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Consecutive days with focus</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Planner Completion</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
                {Math.round(dailyFocus.plannerCompletion)}%
              </p>
              <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${Math.min(dailyFocus.plannerCompletion, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 4: Character Development */}
      <div>
        <SectionHeading title="Character Development" href="/life-os" linkLabel="View all traits" />
        <Card>
          {topCharacterTraits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No character traits yet</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {topCharacterTraits.map((trait) => (
                  <div key={trait.id} className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{trait.name}</p>
                      {trait.updatedThisWeek && (
                        <span className="text-[10px] font-medium text-green-600">↑ this week</span>
                      )}
                    </div>
                    <p className="mt-1 text-xl font-bold text-gray-900 tabular-nums">
                      {trait.level}<span className="text-sm font-normal text-gray-400">/10</span>
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-900 transition-all duration-500"
                        style={{ width: `${(trait.level / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                {characterWeeklyTrend} trait{characterWeeklyTrend !== 1 ? 's' : ''} updated this week
              </p>
            </>
          )}
        </Card>
      </div>

      {/* SECTION 5: Finance Snapshot */}
      <div>
        <SectionHeading title="Finance Snapshot" href="/life-os" linkLabel="View portfolio" />
        <Card>
          {lifeOsSnapshot.portfolioCount === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No portfolio assets — add stocks in Life OS</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Portfolio Today</p>
                <p className={`mt-1.5 text-2xl font-bold tabular-nums ${lifeOsSnapshot.portfolioDailyPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatPct(lifeOsSnapshot.portfolioDailyPct)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Best Today</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">
                  {lifeOsSnapshot.bestAsset?.symbol ?? '—'}
                </p>
                {lifeOsSnapshot.bestAsset && (
                  <p className="text-xs text-green-600 tabular-nums">{formatPct(lifeOsSnapshot.bestAsset.pct)}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Worst Today</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">
                  {lifeOsSnapshot.worstAsset?.symbol ?? '—'}
                </p>
                {lifeOsSnapshot.worstAsset && (
                  <p className="text-xs text-red-500 tabular-nums">{formatPct(lifeOsSnapshot.worstAsset.pct)}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Watchlist</p>
                <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
                  {lifeOsSnapshot.watchlistCount}
                </p>
                <p className="text-xs text-gray-500">{lifeOsSnapshot.portfolioCount} in portfolio</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 6: Quick Actions */}
      <div>
        <SectionHeading title="Quick Actions" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: '/work', label: 'Add Task', icon: '+' },
            { href: '/plan', label: 'Open Planner', icon: '☰' },
            { href: '/life-os', label: 'Add Journal', icon: '✎' },
            { href: '/life-os', label: 'Record Sleep', icon: '☾' },
            { href: '/life-os', label: 'Record Health', icon: '♥' },
            { href: '/life-os', label: 'Add Business Idea', icon: '💡' },
          ].map((action) => (
            <Link key={action.label} href={action.href} className="block group">
              <Card className="p-4 text-center transition-all group-hover:border-gray-300 group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
                <span className="text-lg font-semibold text-gray-900">{action.icon}</span>
                <p className="text-xs text-gray-600 mt-1">{action.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Compact insights & weekly trends (preserved functionality) */}
      {allInsights.length > 0 && (
        <div>
          <SectionHeading title="Insights" href="/analytics" linkLabel="View analytics" />
          <div className="space-y-2">
            {allInsights.slice(0, 3).map((insight) => (
              <Card key={insight.title + '|' + insight.description} className={`p-4 border-l-4 ${insight.type === 'positive' ? 'border-l-green-500' : insight.type === 'negative' ? 'border-l-red-400' : 'border-l-yellow-400'}`}>
                <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{insight.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {weeklyReport && (
        <div>
          <SectionHeading title="Weekly Trends" href="/analytics" linkLabel="View details" />
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Focus</p>
                <p className="mt-1 text-lg font-bold text-gray-900 tabular-nums">
                  {Math.round(weeklyReport.current.totalFocusMinutes / 60 * 10) / 10}h
                  {weeklyReport.focusTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.focusTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {weeklyReport.focusTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.focusTrend)}%
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Score</p>
                <p className="mt-1 text-lg font-bold text-gray-900 tabular-nums">
                  {weeklyReport.current.avgScore}
                  {weeklyReport.scoreTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.scoreTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {weeklyReport.scoreTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.scoreTrend)}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Items Done</p>
                <p className="mt-1 text-lg font-bold text-gray-900 tabular-nums">
                  {weeklyReport.current.totalTasksCompleted}
                  {weeklyReport.taskTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.taskTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {weeklyReport.taskTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.taskTrend)}%
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Habit Score</p>
                <p className="mt-1 text-lg font-bold text-gray-900 tabular-nums">
                  {weeklyReport.current.avgHabitScore}
                  {weeklyReport.habitTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.habitTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {weeklyReport.habitTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.habitTrend)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
