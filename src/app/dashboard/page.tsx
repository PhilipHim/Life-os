'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useWorkItems } from '@/lib/WorkItemContext'
import { useFocus } from '@/lib/FocusContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { computeProductivityScore, generateProductivityInsights } from '@/lib/productivity-score'
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
import { generateCoachReportAsync, type CoachReport } from '@/lib/coach'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import AICoachCard from '@/components/coach/AICoachCard'
import DashboardChallengesCard from '@/components/challenges/DashboardChallengesCard'
import {
  StrategicSection,
  ScoreHeroCard,
  KpiCard,
} from '@/components/strategic'
import { CompassIcon, MountainIcon } from '@/design-system/icons'
import { losClasses } from '@/design-system/tokens'
import { orderPlanItems } from '@/lib/planner'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  const productivityScore = useMemo(
    () => computeProductivityScore(planItems, workItems, focusSessions, habitStats),
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
    const sortedPlan = orderPlanItems(todayPlan)

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

  const [coachReport, setCoachReport] = useState<CoachReport | null>(null)
  const [coachLoading, setCoachLoading] = useState(true)
  const [coachSource, setCoachSource] = useState<'gemini' | 'rules'>('rules')
  const [coachError, setCoachError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      setCoachLoading(true)
      generateCoachReportAsync({
        workItems,
        planItems,
        todayPlan,
        focusSessions,
        productivityScore,
        lifeScore,
        buildDone,
        buildTotal,
        avoidSuccess,
        avoidTotal,
        activeTaskTitle: dailyFocus.currentTask,
        nextPriorityTaskTitle: dailyFocus.nextTaskTitle,
      })
        .then(({ report, source, error }) => {
          if (cancelled) return
          setCoachReport(report)
          setCoachSource(source)
          setCoachError(error ?? null)
          setCoachLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setCoachLoading(false)
        })
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    workItems, planItems, todayPlan, focusSessions, productivityScore, lifeScore,
    buildDone, buildTotal, avoidSuccess, avoidTotal,
    dailyFocus.currentTask, dailyFocus.nextTaskTitle,
  ])

  return (
    <div className={`${losClasses.page} space-y-12`}>
      <header className={losClasses.pageHeader}>
        <div className="flex items-center gap-3">
          <CompassIcon size={28} className="text-los-gold" />
          <h1 className={losClasses.pageTitle}>Command Center</h1>
        </div>
        <p className={losClasses.pageSubtitle}>
          Your Life OS overview — productivity, health, and daily progress at a glance
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <ScoreHeroCard
          label="Productivity Score"
          total={productivityScore.total}
          max={100}
          breakdown={[
            { label: 'Planner', ...productivityScore.planner, percentage: productivityScore.planner.percentage },
            { label: 'Priority', ...productivityScore.priority, percentage: productivityScore.priority.percentage },
            { label: 'Focus', ...productivityScore.focus, percentage: productivityScore.focus.percentage },
            { label: 'Habits', ...productivityScore.habits, percentage: productivityScore.habits.percentage },
          ]}
        />

        {lifeScore && (
          <ScoreHeroCard
            label="Life Score"
            total={lifeScore.total}
            max={lifeScore.max}
            breakdown={[
              { label: 'Productivity', score: lifeScore.productivity, max: lifeScore.max, percentage: lifeScore.productivity },
              { label: 'Health', score: lifeScore.health ?? 0, max: lifeScore.max, percentage: lifeScore.health ?? 0 },
              { label: 'Mind', score: lifeScore.mind, max: lifeScore.max, percentage: lifeScore.mind },
              { label: 'Habits', score: lifeScore.habits, max: lifeScore.max, percentage: lifeScore.habits },
            ]}
          />
        )}
      </div>

      {coachLoading && !coachReport && (
        <Card variant="ai" className="p-8 text-center los-ai-surface">
          <p className="text-sm text-los-ai">AI Coach is analyzing your Life OS data…</p>
        </Card>
      )}
      {coachReport && (
        <>
          {coachError && (
            <Card className="border-los-warning/40 bg-los-warning/10 p-4">
              <p className="text-sm text-los-warning">
                <span className="font-semibold">Gemini unavailable — showing offline coach.</span>{' '}
                {coachError.includes('429') || coachError.includes('quota')
                  ? 'API quota exceeded. Wait a minute or set GEMINI_MODEL=gemini-2.5-flash in .env.local and restart the dev server.'
                  : coachError}
              </p>
            </Card>
          )}
          <AICoachCard report={coachReport} loading={coachLoading} poweredByGemini={coachSource === 'gemini'} />
        </>
      )}

      <StrategicSection title="Today Overview" subtitle="Daily health, wellness, and habit snapshot" href="/life-os" linkLabel="Open Life OS">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Sleep Score"
            metric={lifeOsSnapshot.sleepScore != null ? String(lifeOsSnapshot.sleepScore) : '—'}
            sublabel={lifeOsSnapshot.sleepScore != null ? 'Logged today' : 'Not logged'}
            href="/life-os"
          />
          <KpiCard
            label="Health Score"
            metric={lifeOsSnapshot.healthScore != null ? String(lifeOsSnapshot.healthScore) : '—'}
            sublabel={lifeOsSnapshot.healthScore != null ? 'Logged today' : 'Not logged'}
            href="/life-os"
          />
          <KpiCard
            label="Days Without Illness"
            metric={lifeOsSnapshot.isSick ? '0' : String(lifeOsSnapshot.daysWithoutIllness)}
            sublabel={lifeOsSnapshot.isSick ? 'Currently sick' : 'Healthy streak'}
            href="/life-os"
            highlight={!lifeOsSnapshot.isSick && lifeOsSnapshot.daysWithoutIllness > 0}
          />
          <KpiCard
            label="Journal Today"
            metric={lifeOsSnapshot.journalCompleted ? 'Done' : '—'}
            sublabel={lifeOsSnapshot.journalCompleted ? 'Entry saved' : 'Not completed'}
            href="/life-os"
            highlight={lifeOsSnapshot.journalCompleted}
          />
          <KpiCard
            label="Habits Today"
            metric={todayHabitsTotal > 0 ? `${habitRate}%` : '—'}
            sublabel={todayHabitsTotal > 0 ? `${todayHabitsDone}/${todayHabitsTotal} done` : 'No habits'}
            progress={habitRate}
            href="/habits/today"
            highlight={habitRate >= 80}
          />
        </div>
      </StrategicSection>

      <StrategicSection
        title="Challenges"
        subtitle="Daily goals with bonus XP"
        href="/profile"
        linkLabel="View profile"
        icon={<MountainIcon size={20} />}
      >
        <DashboardChallengesCard />
      </StrategicSection>

      <StrategicSection title="Daily Focus" subtitle="Execution priorities and planner momentum" href="/plan" linkLabel="Open Planner">
        <Card>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="los-section-label">Active Task</p>
              <p className="mt-2 text-sm font-semibold text-los-text-primary truncate">
                {dailyFocus.currentTask ?? 'None in focus'}
              </p>
              {activeSession && <p className="mt-1 text-xs text-los-success font-medium">In focus now</p>}
            </div>
            <div>
              <p className="los-section-label">Next Priority</p>
              <p className="mt-2 text-sm font-semibold text-los-text-primary truncate">
                {dailyFocus.nextTaskTitle ?? 'No high-priority items'}
              </p>
              <Link href="/work" className="mt-1 text-xs text-los-gold hover:text-los-gold-light transition-colors">
                View work items →
              </Link>
            </div>
            <div>
              <p className="los-section-label">Focus Streak</p>
              <p className="mt-2 text-2xl font-bold text-los-text-primary tabular-nums">
                {dailyFocus.focusStreak}
                <span className="text-sm font-normal text-los-text-muted"> days</span>
              </p>
              <p className="mt-1 text-xs text-los-text-muted">Consecutive days with focus</p>
            </div>
            <div>
              <p className="los-section-label">Planner Completion</p>
              <p className="mt-2 text-2xl font-bold text-los-gold tabular-nums">
                {Math.round(dailyFocus.plannerCompletion)}%
              </p>
              <div className="mt-2">
                <ProgressBar value={dailyFocus.plannerCompletion} variant="gold" size="sm" />
              </div>
            </div>
          </div>
        </Card>
      </StrategicSection>

      <StrategicSection title="Character Development" subtitle="Top traits and weekly growth" href="/life-os" linkLabel="View all traits">
        <Card>
          {topCharacterTraits.length === 0 ? (
            <p className="text-sm text-los-text-muted text-center py-2">No character traits yet</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {topCharacterTraits.map((trait) => (
                  <div key={trait.id} className="rounded-lg border border-los-border bg-los-bg-secondary/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-los-text-primary">{trait.name}</p>
                      {trait.updatedThisWeek && (
                        <span className="text-[10px] font-medium text-los-success">↑ this week</span>
                      )}
                    </div>
                    <p className="mt-1 text-xl font-bold text-los-gold tabular-nums">
                      {trait.level}<span className="text-sm font-normal text-los-text-muted">/10</span>
                    </p>
                    <div className="mt-2">
                      <ProgressBar value={(trait.level / 10) * 100} variant="gold" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-los-text-muted">
                {characterWeeklyTrend} trait{characterWeeklyTrend !== 1 ? 's' : ''} updated this week
              </p>
            </>
          )}
        </Card>
      </StrategicSection>

      <StrategicSection title="Finance Snapshot" subtitle="Portfolio performance today" href="/life-os" linkLabel="View portfolio">
        <Card>
          {lifeOsSnapshot.portfolioCount === 0 ? (
            <p className="text-sm text-los-text-muted text-center py-2">No portfolio assets — add stocks in Life OS</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="los-section-label">Portfolio Today</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${lifeOsSnapshot.portfolioDailyPct >= 0 ? 'text-los-success' : 'text-los-danger'}`}>
                  {formatPct(lifeOsSnapshot.portfolioDailyPct)}
                </p>
              </div>
              <div>
                <p className="los-section-label">Best Today</p>
                <p className="mt-2 text-sm font-semibold text-los-text-primary">{lifeOsSnapshot.bestAsset?.symbol ?? '—'}</p>
                {lifeOsSnapshot.bestAsset && (
                  <p className="text-xs text-los-success tabular-nums">{formatPct(lifeOsSnapshot.bestAsset.pct)}</p>
                )}
              </div>
              <div>
                <p className="los-section-label">Worst Today</p>
                <p className="mt-2 text-sm font-semibold text-los-text-primary">{lifeOsSnapshot.worstAsset?.symbol ?? '—'}</p>
                {lifeOsSnapshot.worstAsset && (
                  <p className="text-xs text-los-danger tabular-nums">{formatPct(lifeOsSnapshot.worstAsset.pct)}</p>
                )}
              </div>
              <div>
                <p className="los-section-label">Watchlist</p>
                <p className="mt-2 text-2xl font-bold text-los-text-primary tabular-nums">{lifeOsSnapshot.watchlistCount}</p>
                <p className="text-xs text-los-text-muted">{lifeOsSnapshot.portfolioCount} in portfolio</p>
              </div>
            </div>
          )}
        </Card>
      </StrategicSection>

      <StrategicSection title="Quick Actions">
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
              <Card variant="interactive" className="p-4 text-center cursor-pointer group-hover:-translate-y-0.5">
                <span className="text-lg font-semibold text-los-gold">{action.icon}</span>
                <p className="text-xs text-los-text-secondary mt-1">{action.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </StrategicSection>

      {allInsights.length > 0 && (
        <StrategicSection title="Insights" subtitle="Patterns detected from today's activity" href="/analytics" linkLabel="View analytics">
          <div className="space-y-2">
            {allInsights.slice(0, 3).map((insight) => (
              <Card
                key={insight.title + '|' + insight.description}
                className={`p-4 ${
                  insight.type === 'positive'
                    ? 'los-insight-card--positive'
                    : insight.type === 'negative'
                      ? 'los-insight-card--negative'
                      : 'los-insight-card--neutral'
                }`}
              >
                <p className="font-semibold text-los-text-primary text-sm">{insight.title}</p>
                <p className="text-xs text-los-text-muted mt-1">{insight.description}</p>
              </Card>
            ))}
          </div>
        </StrategicSection>
      )}

      {weeklyReport && (
        <StrategicSection title="Weekly Trends" subtitle="Week-over-week performance" href="/analytics" linkLabel="View details">
          <Card className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="los-section-label">Focus</p>
                <p className="mt-2 text-lg font-bold text-los-text-primary tabular-nums">
                  {Math.round(weeklyReport.current.totalFocusMinutes / 60 * 10) / 10}h
                  {weeklyReport.focusTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.focusTrend > 0 ? 'text-los-success' : 'text-los-danger'}`}>
                      {weeklyReport.focusTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.focusTrend)}%
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="los-section-label">Score</p>
                <p className="mt-2 text-lg font-bold text-los-gold tabular-nums">
                  {weeklyReport.current.avgScore}
                  {weeklyReport.scoreTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.scoreTrend > 0 ? 'text-los-success' : 'text-los-danger'}`}>
                      {weeklyReport.scoreTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.scoreTrend)}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="los-section-label">Items Done</p>
                <p className="mt-2 text-lg font-bold text-los-text-primary tabular-nums">
                  {weeklyReport.current.totalTasksCompleted}
                  {weeklyReport.taskTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.taskTrend > 0 ? 'text-los-success' : 'text-los-danger'}`}>
                      {weeklyReport.taskTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.taskTrend)}%
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="los-section-label">Habit Score</p>
                <p className="mt-2 text-lg font-bold text-los-text-primary tabular-nums">
                  {weeklyReport.current.avgHabitScore}
                  {weeklyReport.habitTrend !== 0 && (
                    <span className={`ml-1 text-xs font-medium ${weeklyReport.habitTrend > 0 ? 'text-los-success' : 'text-los-danger'}`}>
                      {weeklyReport.habitTrend > 0 ? '↑' : '↓'}{Math.abs(weeklyReport.habitTrend)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </StrategicSection>
      )}
    </div>
  )
}
