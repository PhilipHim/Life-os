'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useWorkItems } from '@/lib/WorkItemContext'
import { useFocus } from '@/lib/FocusContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { formatFocusTime } from '@/lib/focus'
import { computeProductivityScore, generateProductivityInsights, type ProductivityScore } from '@/lib/productivity-score'
import { computeWorkCompletionRate, computeAverageGroupProgress } from '@/lib/score'
import { useHabits } from '@/lib/HabitContext'
import { getInsights } from '@/lib/insights'
import { getWeeklyReport, type WeeklyReport } from '@/lib/weekly'
import { computeLifeScore } from '@/lib/life-score'
import type { LifeScoreResult } from '@/lib/life-score'
import Card from '@/components/ui/Card'

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
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span />
        <span>{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  metric,
  sublabel,
  progress,
  href,
  children,
}: {
  label: string
  metric: string
  sublabel?: string
  progress?: number
  href: string
  children?: React.ReactNode
}) {
  return (
    <Link href={href} className="block group">
      <Card className="transition-all duration-200 group-hover:border-gray-300 group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer h-full">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">{metric}</p>
        {sublabel && (
          <p className="mt-1 text-sm text-gray-500">{sublabel}</p>
        )}
        {progress !== undefined && (
          <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        {children}
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const { workItems } = useWorkItems()
  const { focusSessions } = useFocus()
  const { planItems } = useDailyPlan()
  const { buildDone, buildTotal, avoidSuccess, avoidTotal, habitScore } = useHabits()
  const todayHabitsDone = buildDone + avoidSuccess
  const todayHabitsTotal = buildTotal + avoidTotal
  const [insights, setInsights] = useState<ReturnType<typeof getInsights>>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
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

  const singles = workItems.filter((i) => i.type === 'single' && i.status !== 'deleted')
  const groups = workItems.filter((i) => i.type === 'group' && i.status !== 'deleted')
  const totalSingles = singles.length
  const doneSingles = singles.filter((i) => i.status === 'completed').length
  const workCompletionRate = Math.round(computeWorkCompletionRate(workItems) * 100)
  const remaining = totalSingles - doneSingles

  const avgGroupProgress = computeAverageGroupProgress(workItems)
  const completedGroups = groups.filter((i) => i.status === 'completed').length

  const habitRate = todayHabitsTotal > 0 ? Math.round((todayHabitsDone / todayHabitsTotal) * 100) : 0

  const todayFocusStats = useMemo(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const todaySessions = focusSessions.filter((s) => s.date === todayStr && s.duration > 0)
    const totalMs = todaySessions.reduce((sum, s) => sum + s.duration, 0)
    const longestMs = todaySessions.reduce((max, s) => Math.max(max, s.duration), 0)
    return { totalMs, sessionCount: todaySessions.length, longestMs }
  }, [focusSessions])

  const weekFocusStats = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    const weekStart = new Date(mondayStr + 'T00:00:00')
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekSessions = focusSessions.filter((s) => {
      const d = new Date(s.date + 'T00:00:00')
      return d >= weekStart && d < weekEnd && s.duration > 0
    })

    const totalMs = weekSessions.reduce((sum, s) => sum + s.duration, 0)
    const sessionCount = weekSessions.length
    const avgSessionMs = sessionCount > 0 ? Math.round(totalMs / sessionCount) : 0

    const byWorkItem = new Map<string, number>()
    for (const s of weekSessions) {
      byWorkItem.set(s.workItemId, (byWorkItem.get(s.workItemId) || 0) + s.duration)
    }
    let topWorkItemId: string | null = null
    let topWorkItemMs = 0
    for (const [id, ms] of byWorkItem) {
      if (ms > topWorkItemMs) {
        topWorkItemMs = ms
        topWorkItemId = id
      }
    }

    const topWorkItem = topWorkItemId ? workItems.find((w) => w.id === topWorkItemId) : null

    return { totalMs, avgSessionMs, topWorkItemName: topWorkItem?.title ?? null, sessionCount }
  }, [focusSessions, workItems])

  const perWorkItemFocus = useMemo(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const map = new Map<string, { totalMs: number; todayMs: number; sessionCount: number }>()

    for (const s of focusSessions) {
      if (s.duration === 0 || !s.workItemId) continue
      const existing = map.get(s.workItemId) ?? { totalMs: 0, todayMs: 0, sessionCount: 0 }
      existing.totalMs += s.duration
      existing.sessionCount += 1
      if (s.date === todayStr) {
        existing.todayMs += s.duration
      }
      map.set(s.workItemId, existing)
    }

    return map
  }, [focusSessions])

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Productivity Score</p>
          <p className="mt-2 text-7xl font-bold text-gray-900">
            {productivityScore.total}
            <span className="text-3xl font-normal text-gray-400"> / 100</span>
          </p>
          <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden max-w-md mx-auto">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
              style={{ width: `${productivityScore.total}%` }}
            />
          </div>
          <div className="mt-6 space-y-3 max-w-md mx-auto">
            <BreakDownRow
              label="Planner"
              score={productivityScore.planner.score}
              max={productivityScore.planner.max}
              percentage={productivityScore.planner.percentage}
            />
            <BreakDownRow
              label="Priority"
              score={productivityScore.priority.score}
              max={productivityScore.priority.max}
              percentage={productivityScore.priority.percentage}
            />
            <BreakDownRow
              label="Focus"
              score={productivityScore.focus.score}
              max={productivityScore.focus.max}
              percentage={productivityScore.focus.percentage}
            />
            <BreakDownRow
              label="Habits"
              score={productivityScore.habits.score}
              max={productivityScore.habits.max}
              percentage={productivityScore.habits.percentage}
            />
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                <span>Total</span>
                <span className="tabular-nums">{productivityScore.total} / 100</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
                  style={{ width: `${productivityScore.total}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {lifeScore && (
          <Card className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Life Score</p>
            <p className="mt-2 text-7xl font-bold text-gray-900">
              {lifeScore.total}
              <span className="text-3xl font-normal text-gray-400"> / {lifeScore.max}</span>
            </p>
            <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden max-w-md mx-auto">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
                style={{ width: `${lifeScore.total}%` }}
              />
            </div>
            <div className="mt-6 space-y-3 max-w-md mx-auto">
              <BreakDownRow
                label="Productivity"
                score={lifeScore.productivity}
                max={lifeScore.max}
                percentage={lifeScore.productivity}
              />
              <BreakDownRow
                label="Health"
                score={lifeScore.health ?? 0}
                max={lifeScore.max}
                percentage={lifeScore.health ?? 0}
              />
              <BreakDownRow
                label="Mind"
                score={lifeScore.mind}
                max={lifeScore.max}
                percentage={lifeScore.mind}
              />
              <BreakDownRow
                label="Habits"
                score={lifeScore.habits}
                max={lifeScore.max}
                percentage={lifeScore.habits}
              />
            </div>
          </Card>
        )}
      </div>

      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">Today&rsquo;s Habits</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">Build Habits</span>
              <span className="text-gray-900 font-medium tabular-nums">{buildDone}<span className="text-gray-400 font-normal"> / {buildTotal}</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-500"
                style={{ width: `${buildTotal > 0 ? (buildDone / buildTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">Avoid Habits</span>
              <span className="text-gray-900 font-medium tabular-nums">{avoidSuccess}<span className="text-gray-400 font-normal"> / {avoidTotal}</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-600 transition-all duration-500"
                style={{ width: `${avoidTotal > 0 ? (avoidSuccess / avoidTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
          {habitScore.total > 0 && (
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Habit Score</span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">{habitScore.total}<span className="text-sm font-normal text-gray-400">/100</span></span>
            </div>
          )}
        </div>
      </Card>

      {allInsights.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-4">Insights</h2>
          <div className="space-y-3">
            {allInsights.map((insight) => (
              <Card key={insight.title + '|' + insight.description} className={`border-l-4 ${insight.type === 'positive' ? 'border-l-green-500' : insight.type === 'negative' ? 'border-l-red-400' : 'border-l-yellow-400'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">
                    {insight.type === 'positive' ? '✓' : insight.type === 'negative' ? '!' : 'i'}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{insight.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <KpiCard
          label="Work Completion"
          metric={`${doneSingles}/${totalSingles}`}
          sublabel={totalSingles > 0 ? `${workCompletionRate}% · ${remaining} remaining` : 'No items'}
          progress={workCompletionRate}
          href="/work"
        />

        <KpiCard
          label="Groups"
          metric={`${groups.length}`}
          sublabel={
            groups.length > 0
              ? `${avgGroupProgress}% avg progress · ${completedGroups} completed`
              : 'No groups'
          }
          progress={avgGroupProgress}
          href="/work"
        />

        <KpiCard
          label="Habits"
          metric={todayHabitsTotal > 0 ? `${habitRate}%` : '—'}
          sublabel={
            todayHabitsTotal > 0
              ? `Build ${buildDone}/${buildTotal} · Avoid ${avoidSuccess}/${avoidTotal}`
              : 'No habits'
          }
          progress={habitRate}
          href="/habits/today"
        >
          {todayHabitsTotal > 0 && habitScore.total > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Score: {habitScore.total}/100
            </p>
          )}
        </KpiCard>
      </div>

      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Focus Analytics</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Today</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatFocusTime(todayFocusStats.totalMs)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {todayFocusStats.sessionCount} session{todayFocusStats.sessionCount !== 1 ? 's' : ''}
              {todayFocusStats.longestMs > 0 && (
                <> · Longest: {formatFocusTime(todayFocusStats.longestMs)}</>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">This Week</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatFocusTime(weekFocusStats.totalMs)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {weekFocusStats.sessionCount} sessions · Avg: {formatFocusTime(weekFocusStats.avgSessionMs)}
            </p>
            {weekFocusStats.topWorkItemName && (
              <p className="mt-1 text-sm text-gray-500">
                Most focused: {weekFocusStats.topWorkItemName}
              </p>
            )}
          </div>
        </div>
        {(() => {
          const items = Array.from(perWorkItemFocus.entries())
            .filter(([id]) => id)
            .sort(([, a], [, b]) => b.totalMs - a.totalMs)
            .slice(0, 10)
          if (items.length === 0) return null
          return (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Per Work Item</p>
              <div className="grid gap-2">
                {items.map(([workItemId, stats]) => {
                  const wi = workItems.find((w) => w.id === workItemId)
                  return (
                    <div key={workItemId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 truncate">{wi?.title ?? 'Unknown'}</span>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-gray-500 tabular-nums">{formatFocusTime(stats.totalMs)} total</span>
                        <span className="text-gray-400 tabular-nums">{formatFocusTime(stats.todayMs)} today</span>
                        <span className="text-gray-400 tabular-nums">{stats.sessionCount} sessions</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </Card>

      {weeklyReport && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Weekly Trends</p>
            <Link href="/analytics" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              View Details →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Focus</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-xl font-bold text-gray-900">{Math.round(weeklyReport.current.totalFocusMinutes / 60 * 10) / 10}h</p>
                {weeklyReport.focusTrend !== 0 && (
                  <span className={`text-xs font-medium ${weeklyReport.focusTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weeklyReport.focusTrend > 0 ? '↑' : '↓'} {Math.abs(weeklyReport.focusTrend)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-xl font-bold text-gray-900">{weeklyReport.current.avgScore}</p>
                {weeklyReport.scoreTrend !== 0 && (
                  <span className={`text-xs font-medium ${weeklyReport.scoreTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weeklyReport.scoreTrend > 0 ? '↑' : '↓'} {Math.abs(weeklyReport.scoreTrend)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Items Done</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-xl font-bold text-gray-900">{weeklyReport.current.totalTasksCompleted}</p>
                {weeklyReport.taskTrend !== 0 && (
                  <span className={`text-xs font-medium ${weeklyReport.taskTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weeklyReport.taskTrend > 0 ? '↑' : '↓'} {Math.abs(weeklyReport.taskTrend)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Habit Score</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-xl font-bold text-gray-900">{weeklyReport.current.avgHabitScore}</p>
                {weeklyReport.habitTrend !== 0 && (
                  <span className={`text-xs font-medium ${weeklyReport.habitTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weeklyReport.habitTrend > 0 ? '↑' : '↓'} {Math.abs(weeklyReport.habitTrend)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
