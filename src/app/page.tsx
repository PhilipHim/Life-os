'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useWorkItems } from '@/lib/WorkItemContext'
import { useFocus } from '@/lib/FocusContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { useHabits } from '@/lib/HabitContext'
import { formatFocusTime } from '@/lib/focus'
import { computeProductivityScore } from '@/lib/productivity-score'
import { computeLifeScore } from '@/lib/life-score'
import Card from '@/components/ui/Card'

export default function Home() {
  const { workItems } = useWorkItems()
  const { focusSessions } = useFocus()
  const { planItems } = useDailyPlan()
  const { buildDone, buildTotal, avoidSuccess, avoidTotal } = useHabits()

  const habitStats = useMemo(() => ({
    completed: buildDone + avoidSuccess,
    total: buildTotal + avoidTotal,
  }), [buildDone, avoidSuccess, buildTotal, avoidTotal])

  const productivityScore = useMemo(() =>
    computeProductivityScore(planItems, workItems, focusSessions, habitStats),
    [planItems, workItems, focusSessions, habitStats]
  )

  const lifeScore = useMemo(() => computeLifeScore(new Date(), {
    plannerCompletionPct: productivityScore.planner.percentage,
    focusMinutes: productivityScore.focus.totalMinutes,
    buildDone, buildTotal, avoidSuccess, avoidTotal,
  }), [productivityScore, buildDone, buildTotal, avoidSuccess, avoidTotal])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todaySessions = focusSessions.filter((s) => s.date === todayStr && s.duration > 0)
  const totalFocusMs = todaySessions.reduce((sum, s) => sum + s.duration, 0)
  const todayPlanItems = planItems.filter((pi) => pi.date === todayStr)
  const plannedDone = todayPlanItems.filter((pi) =>
    workItems.find((w) => w.id === pi.workItemId)?.status === 'completed'
  ).length

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Productivity OS</h1>
        <p className="text-base text-gray-500">Your daily command center</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Productivity Score</p>
          <p className="mt-2 text-5xl font-bold text-gray-900 tabular-nums">
            {productivityScore.total}
            <span className="text-2xl font-normal text-gray-400"> / 100</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
              style={{ width: `${productivityScore.total}%` }}
            />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Life Score</p>
          <p className="mt-2 text-5xl font-bold text-gray-900 tabular-nums">
            {lifeScore.total}
            <span className="text-2xl font-normal text-gray-400"> / {lifeScore.max}</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-700 ease-out"
              style={{ width: `${lifeScore.total}%` }}
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 mb-3">Today Summary</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Tasks</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
              {plannedDone}<span className="text-base font-normal text-gray-400"> / {todayPlanItems.length}</span>
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {todayPlanItems.length === 0 ? 'Nothing planned today' : `${plannedDone} done today`}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Focus</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
              {formatFocusTime(totalFocusMs)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {todaySessions.length === 1 ? '1 session' : `${todaySessions.length} sessions`}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Habits</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
              {habitStats.completed}<span className="text-base font-normal text-gray-400"> / {habitStats.total}</span>
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {habitStats.total === 0 ? 'No habits today' : `${habitStats.total - habitStats.completed} remaining`}
            </p>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/work" className="block">
            <Card className="text-center transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <span className="text-lg font-semibold text-gray-900">+</span>
              <p className="text-sm text-gray-600 mt-0.5">Add Task</p>
            </Card>
          </Link>
          <Link href="/work" className="block">
            <Card className="text-center transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <span className="text-lg font-semibold text-gray-900">&#9654;</span>
              <p className="text-sm text-gray-600 mt-0.5">Start Focus</p>
            </Card>
          </Link>
          <Link href="/plan" className="block">
            <Card className="text-center transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <span className="text-lg font-semibold text-gray-900">&#9776;</span>
              <p className="text-sm text-gray-600 mt-0.5">Open Planner</p>
            </Card>
          </Link>
          <Link href="/life-os" className="block">
            <Card className="text-center transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <span className="text-lg font-semibold text-gray-900">&#9998;</span>
              <p className="text-sm text-gray-600 mt-0.5">Open Journal</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
