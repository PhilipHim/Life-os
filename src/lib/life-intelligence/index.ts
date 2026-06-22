import { getHabits } from '@/lib/db/habits'
import { getEntries as getHabitEntries } from '@/lib/db/habit-entries'
import { getCharacterAreas } from '@/lib/db/character'
import type {
  DaySnapshot,
  IntelligenceInsight,
  LifeIntelligenceReport,
  PatternLink,
  PerformancePeak,
  SmartRecommendation,
  TrendInsight,
  WeakArea,
} from '@/lib/life-intelligence/types'
import { collectDaySnapshots, hasAnyLifeData } from '@/lib/life-intelligence/snapshots'
import {
  avg,
  displayDate,
  getMonday,
  monthLabel,
  pearson,
  pctDelta,
  weekLabel,
  dateStr,
} from '@/lib/life-intelligence/utils'

function isHabitSuccess(habitId: string, kind: 'build' | 'avoid', date: string): boolean {
  const entry = getHabitEntries().find((e) => e.habitId === habitId && e.date === date)
  if (kind === 'build') return entry?.completed ?? false
  return !entry
}

function buildPersonalInsights(snapshots: DaySnapshot[]): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = []
  let id = 0

  const withSleep = snapshots.filter((s) => s.sleepScore != null)
  const goodSleep = withSleep.filter((s) => (s.sleepScore ?? 0) >= 75)
  const poorSleep = withSleep.filter((s) => (s.sleepScore ?? 0) > 0 && (s.sleepScore ?? 0) < 60)
  if (goodSleep.length >= 3 && poorSleep.length >= 3) {
    const goodAvg = avg(goodSleep.map((s) => s.productivity))
    const poorAvg = avg(poorSleep.map((s) => s.productivity))
    if (goodAvg != null && poorAvg != null && goodAvg > poorAvg) {
      const delta = pctDelta(goodAvg, poorAvg)
      if (delta != null && delta >= 5) {
        insights.push({
          id: `pi-${++id}`,
          text: `You are ${delta}% more productive on days with sleep scores of 75+.`,
        })
      }
    }
  }

  const byWeekday = new Map<number, number[]>()
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  for (const s of snapshots.filter((d) => d.productivity > 0)) {
    const list = byWeekday.get(s.weekday) ?? []
    list.push(s.productivity)
    byWeekday.set(s.weekday, list)
  }
  let bestWeekday: { name: string; avg: number } | null = null
  for (const [day, scores] of byWeekday) {
    if (scores.length < 2) continue
    const mean = avg(scores)
    if (mean == null) continue
    const name = WEEKDAYS[day]
    if (!bestWeekday || mean > bestWeekday.avg) {
      bestWeekday = { name, avg: mean }
    }
  }
  if (bestWeekday) {
    insights.push({
      id: `pi-${++id}`,
      text: `Your strongest weekday for productivity is ${bestWeekday.name} (avg ${bestWeekday.avg}/100).`,
    })
  }

  const journalDays = snapshots.filter((s) => s.journalLogged)
  const noJournalDays = snapshots.filter((s) => !s.journalLogged && s.habitScore >= 0)
  if (journalDays.length >= 3 && noJournalDays.length >= 3) {
    const jAvg = avg(journalDays.map((s) => s.habitScore))
    const nAvg = avg(noJournalDays.map((s) => s.habitScore))
    if (jAvg != null && nAvg != null && jAvg > nAvg) {
      const delta = pctDelta(jAvg, nAvg)
      if (delta != null && delta >= 5) {
        insights.push({
          id: `pi-${++id}`,
          text: `You complete ${delta}% more habits on days when you journal.`,
        })
      }
    }
  }

  const healthPairs = snapshots.filter((s) => s.healthScore != null)
  if (healthPairs.length >= 5) {
    const healthVals = healthPairs.map((s) => s.healthScore!)
    const lifeVals = healthPairs.map((s) => s.lifeScore)
    const r = pearson(healthVals, lifeVals)
    if (r != null && r >= 0.35) {
      insights.push({
        id: `pi-${++id}`,
        text: `Health score and Life Score move together (correlation ${r.toFixed(2)} over ${healthPairs.length} logged days).`,
      })
    }
  }

  const workoutDays = snapshots.filter((s) => s.workoutLogged)
  const restDays = snapshots.filter((s) => !s.workoutLogged && s.lifeScore > 0)
  if (workoutDays.length >= 3 && restDays.length >= 5) {
    const wAvg = avg(workoutDays.map((s) => s.lifeScore))
    const rAvg = avg(restDays.map((s) => s.lifeScore))
    if (wAvg != null && rAvg != null && wAvg > rAvg) {
      const delta = pctDelta(wAvg, rAvg)
      if (delta != null && delta >= 5) {
        insights.push({
          id: `pi-${++id}`,
          text: `Life Score averages ${delta}% higher on workout days.`,
        })
      }
    }
  }

  const healthyDays = snapshots.filter((s) => !s.sickDay && s.productivity > 0)
  const sickDays = snapshots.filter((s) => s.sickDay)
  if (sickDays.length >= 2 && healthyDays.length >= 5) {
    const hAvg = avg(healthyDays.map((s) => s.productivity))
    const sAvg = avg(sickDays.map((s) => s.productivity))
    if (hAvg != null && sAvg != null && hAvg > sAvg) {
      const delta = pctDelta(hAvg, sAvg)
      if (delta != null && delta >= 10) {
        insights.push({
          id: `pi-${++id}`,
          text: `Productivity drops ${delta}% on illness days compared to healthy days.`,
        })
      }
    }
  }

  return insights.slice(0, 6)
}

function buildBestPerformance(snapshots: DaySnapshot[]): PerformancePeak[] {
  const peaks: PerformancePeak[] = []
  if (snapshots.length === 0) return peaks

  const bestLife = [...snapshots].sort((a, b) => b.lifeScore - a.lifeScore)[0]
  if (bestLife.lifeScore > 0) {
    peaks.push({
      label: 'Best Day',
      date: bestLife.date,
      displayDate: displayDate(bestLife.date),
      value: bestLife.lifeScore,
      unit: 'Life Score',
    })
  }

  const bestProd = [...snapshots].sort((a, b) => b.productivity - a.productivity)[0]
  if (bestProd.productivity > 0) {
    peaks.push({
      label: 'Highest Productivity',
      date: bestProd.date,
      displayDate: displayDate(bestProd.date),
      value: bestProd.productivity,
      unit: 'Productivity',
    })
  }

  if (bestLife.lifeScore > 0) {
    peaks.push({
      label: 'Highest Life Score',
      date: bestLife.date,
      displayDate: displayDate(bestLife.date),
      value: bestLife.lifeScore,
      unit: 'Life Score',
    })
  }

  const weekMap = new Map<string, number[]>()
  for (const s of snapshots) {
    const monday = dateStr(getMonday(new Date(s.date + 'T12:00:00')))
    const list = weekMap.get(monday) ?? []
    list.push(s.lifeScore)
    weekMap.set(monday, list)
  }
  let bestWeek: { monday: string; avg: number } | null = null
  for (const [monday, scores] of weekMap) {
    if (scores.length < 3) continue
    const mean = avg(scores)
    if (mean == null) continue
    if (!bestWeek || mean > bestWeek.avg) bestWeek = { monday, avg: mean }
  }
  if (bestWeek) {
    peaks.push({
      label: 'Best Week',
      date: bestWeek.monday,
      displayDate: weekLabel(bestWeek.monday),
      value: bestWeek.avg,
      unit: 'Avg Life Score',
    })
  }

  const monthMap = new Map<string, number[]>()
  for (const s of snapshots) {
    const key = s.date.slice(0, 7)
    const list = monthMap.get(key) ?? []
    list.push(s.lifeScore)
    monthMap.set(key, list)
  }
  let bestMonth: { key: string; avg: number } | null = null
  for (const [key, scores] of monthMap) {
    if (scores.length < 5) continue
    const mean = avg(scores)
    if (mean == null) continue
    if (!bestMonth || mean > bestMonth.avg) bestMonth = { key: key + '-15', avg: mean }
  }
  if (bestMonth) {
    peaks.push({
      label: 'Best Month',
      date: bestMonth.key,
      displayDate: monthLabel(bestMonth.key),
      value: bestMonth.avg,
      unit: 'Avg Life Score',
    })
  }

  return peaks
}

function buildWeakestAreas(snapshots: DaySnapshot[]): WeakArea[] {
  const areas: WeakArea[] = []
  let id = 0

  const habits = getHabits().filter((h) => h.status === 'active')
  if (habits.length > 0) {
    let lowest: { name: string; rate: number } | null = null
    let mostMissed: { name: string; misses: number } | null = null

    for (const habit of habits) {
      let success = 0
      let misses = 0
      const days = Math.min(30, snapshots.length || 30)
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const ds = dateStr(d)
        const ok = isHabitSuccess(habit.id, habit.kind, ds)
        if (ok) success++
        else if (habit.kind === 'avoid') misses++
      }
      const rate = Math.round((success / days) * 100)
      if (!lowest || rate < lowest.rate) lowest = { name: habit.title, rate }
      if (habit.kind === 'avoid' && (!mostMissed || misses > mostMissed.misses)) {
        mostMissed = { name: habit.title, misses }
      }
    }

    if (lowest) {
      areas.push({
        id: `wa-${++id}`,
        label: 'Lowest Habit Consistency',
        detail: `"${lowest.name}" — ${lowest.rate}% over the last 30 days`,
      })
    }
    if (mostMissed && mostMissed.misses >= 3) {
      areas.push({
        id: `wa-${++id}`,
        label: 'Most Missed Goal',
        detail: `"${mostMissed.name}" — ${mostMissed.misses} slip days in 30 days`,
      })
    }
  }

  const traits = getCharacterAreas().filter((a) => a.status === 'active')
  if (traits.length > 0) {
    const lowest = [...traits].sort((a, b) => a.level - b.level)[0]
    areas.push({
      id: `wa-${++id}`,
      label: 'Lowest Character Trait',
      detail: `${lowest.name} — Level ${lowest.level}/10`,
    })
  }

  const recent = snapshots.slice(-30)
  if (recent.length >= 7) {
    const focusAvg = avg(recent.map((s) => s.focusPct)) ?? 0
    const habitAvg = avg(recent.map((s) => s.habitScore)) ?? 0
    const prodAvg = avg(recent.map((s) => s.productivity)) ?? 0

    const bottlenecks: { label: string; score: number; detail: string }[] = [
      {
        label: 'Focus time',
        score: focusAvg,
        detail: `Avg focus utilization ${Math.round(focusAvg)}% of 3h target`,
      },
      {
        label: 'Habit completion',
        score: habitAvg,
        detail: `Avg habit score ${Math.round(habitAvg)}/100`,
      },
      {
        label: 'Daily output',
        score: prodAvg,
        detail: `Avg productivity score ${Math.round(prodAvg)}/100`,
      },
    ]
    bottlenecks.sort((a, b) => a.score - b.score)
    const weakest = bottlenecks[0]
    if (weakest.score < 60) {
      areas.push({
        id: `wa-${++id}`,
        label: 'Most Common Productivity Bottleneck',
        detail: `${weakest.label} — ${weakest.detail}`,
      })
    }
  }

  return areas.slice(0, 4)
}

function weeklyAverages(
  snapshots: DaySnapshot[],
  pick: (s: DaySnapshot) => number | null,
  weeks = 3
): number[] {
  const result: number[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const minDays = w * 7
    const maxDays = (w + 1) * 7
    const slice = snapshots.filter((s) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(s.date + 'T12:00:00').getTime()) / 86400000
      )
      return daysAgo >= minDays && daysAgo < maxDays
    })
    const vals = slice.map(pick).filter((v): v is number => v != null)
    const mean = avg(vals)
    if (mean != null) result.unshift(mean)
  }
  return result
}

function buildTrends(snapshots: DaySnapshot[]): TrendInsight[] {
  const trends: TrendInsight[] = []
  let id = 0

  const metrics: {
    key: string
    pick: (s: DaySnapshot) => number | null
    label: string
  }[] = [
    { key: 'sleep', pick: (s) => s.sleepScore, label: 'Sleep quality' },
    { key: 'health', pick: (s) => s.healthScore, label: 'Health score' },
    { key: 'habits', pick: (s) => s.habitScore, label: 'Habit consistency' },
    { key: 'productivity', pick: (s) => s.productivity, label: 'Productivity' },
    { key: 'life', pick: (s) => s.lifeScore, label: 'Life Score' },
  ]

  for (const metric of metrics) {
    const weekAvgs = weeklyAverages(snapshots, metric.pick, 3)
    if (weekAvgs.length < 2) continue

    let direction: TrendInsight['direction'] = 'stable'
    let message = `${metric.label} is stable over recent weeks.`
    let changePct: number | null = null

    if (weekAvgs.length === 3) {
      const [w1, w2, w3] = weekAvgs
      if (w3 > w2 && w2 > w1 && w1 > 0) {
        direction = 'improving'
        changePct = pctDelta(w3, w1)
        message = `${metric.label} has improved for 3 consecutive weeks.`
      } else if (w3 < w2 && w2 < w1 && w1 > 0) {
        direction = 'declining'
        changePct = pctDelta(w3, w1)
        message = `${metric.label} has declined for 3 consecutive weeks.`
      } else if (w1 > 0) {
        changePct = pctDelta(w3, w1)
        if (changePct != null && changePct >= 5) {
          direction = 'improving'
          message = `${metric.label} is up ${changePct}% over the last 3 weeks.`
        } else if (changePct != null && changePct <= -5) {
          direction = 'declining'
          message = `${metric.label} is down ${Math.abs(changePct)}% over the last 3 weeks.`
        }
      }
    } else {
      const first = weekAvgs[0]
      const last = weekAvgs[weekAvgs.length - 1]
      if (first > 0) {
        changePct = pctDelta(last, first)
        if (changePct != null && changePct >= 5) {
          direction = 'improving'
          message = `${metric.label} is trending up (${changePct}% over 2 weeks).`
        } else if (changePct != null && changePct <= -5) {
          direction = 'declining'
          message = `${metric.label} is trending down (${Math.abs(changePct)}% over 2 weeks).`
        }
      }
    }

    trends.push({
      id: `tr-${++id}`,
      metric: metric.label,
      direction,
      message,
      changePct,
    })
  }

  return trends
}

function buildPatterns(snapshots: DaySnapshot[]): PatternLink[] {
  const patterns: PatternLink[] = []
  let id = 0

  const sleepProd = snapshots.filter((s) => s.sleepScore != null)
  if (sleepProd.length >= 5) {
    const r = pearson(
      sleepProd.map((s) => s.sleepScore!),
      sleepProd.map((s) => s.productivity)
    )
    if (r != null && Math.abs(r) >= 0.3) {
      patterns.push({
        id: `pt-${++id}`,
        cause: 'Sleep quality',
        effect: 'Productivity',
        message:
          r >= 0
            ? `Better sleep correlates with higher productivity (r=${r.toFixed(2)}).`
            : `Lower sleep scores align with weaker productivity days (r=${r.toFixed(2)}).`,
        strength: Math.abs(r),
      })
    }
  }

  const workoutLife = snapshots.filter((s) => s.workoutLogged || s.lifeScore > 0)
  if (workoutLife.length >= 5) {
    const workout = workoutLife.map((s) => (s.workoutLogged ? 1 : 0))
    const life = workoutLife.map((s) => s.lifeScore)
    const r = pearson(workout, life)
    if (r != null && r >= 0.25) {
      patterns.push({
        id: `pt-${++id}`,
        cause: 'Workout days',
        effect: 'Life Score',
        message: `Workout days tend to produce higher Life Scores (r=${r.toFixed(2)}).`,
        strength: Math.abs(r),
      })
    }
  }

  const journalHabit = snapshots.filter((s) => s.habitScore >= 0)
  if (journalHabit.length >= 5) {
    const r = pearson(
      journalHabit.map((s) => (s.journalLogged ? 1 : 0)),
      journalHabit.map((s) => s.habitScore)
    )
    if (r != null && r >= 0.25) {
      patterns.push({
        id: `pt-${++id}`,
        cause: 'Journaling',
        effect: 'Habit completion',
        message: `Journaling days show stronger habit completion (r=${r.toFixed(2)}).`,
        strength: Math.abs(r),
      })
    }
  }

  const healthLife = snapshots.filter((s) => s.healthScore != null)
  if (healthLife.length >= 5) {
    const r = pearson(
      healthLife.map((s) => s.healthScore!),
      healthLife.map((s) => s.lifeScore)
    )
    if (r != null && r >= 0.3) {
      patterns.push({
        id: `pt-${++id}`,
        cause: 'Health score',
        effect: 'Life Score',
        message: `Health improvements track with higher Life Scores (r=${r.toFixed(2)}).`,
        strength: Math.abs(r),
      })
    }
  }

  const focusProd = snapshots.filter((s) => s.focusMinutes > 0 || s.productivity > 0)
  if (focusProd.length >= 5) {
    const r = pearson(
      focusProd.map((s) => s.focusMinutes),
      focusProd.map((s) => s.productivity)
    )
    if (r != null && r >= 0.35) {
      patterns.push({
        id: `pt-${++id}`,
        cause: 'Focus time',
        effect: 'Productivity',
        message: `More focus minutes directly align with higher productivity scores (r=${r.toFixed(2)}).`,
        strength: Math.abs(r),
      })
    }
  }

  return patterns.sort((a, b) => b.strength - a.strength).slice(0, 5)
}

function buildRecommendations(
  patterns: PatternLink[],
  weaknesses: WeakArea[],
  trends: TrendInsight[]
): SmartRecommendation[] {
  const recs: SmartRecommendation[] = []
  let id = 0

  if (patterns.length > 0) {
    const top = patterns[0]
    const actionMap: Record<string, string> = {
      'Sleep quality': 'Protect a consistent bedtime window — your data links sleep directly to output.',
      'Workout days': 'Schedule workouts on your lowest Life Score weekdays to lift overall balance.',
      Journaling: 'Journal before habit check-ins — it precedes your strongest habit days.',
      'Health score': 'Prioritize hydration, movement, and nutrition logging on low-energy days.',
      'Focus time': 'Block 90-minute focus sessions on your top-priority tasks before reactive work.',
    }
    const recommendation =
      actionMap[top.cause] ??
      `Lean into ${top.cause.toLowerCase()} — it shows the strongest link to ${top.effect.toLowerCase()} in your data.`
    recs.push({
      id: `rec-${++id}`,
      basedOn: top.message,
      recommendation,
    })
  }

  const declining = trends.filter((t) => t.direction === 'declining')
  if (declining.length > 0 && recs.length < 3) {
    const t = declining[0]
    const actionMap: Record<string, string> = {
      'Sleep quality': 'Audit bedtime variance this week — sleep is your fastest declining signal.',
      'Health score': 'Re-establish daily health logging; the trend is slipping over recent weeks.',
      'Habit consistency': 'Reduce active habits to your top 3 until consistency recovers.',
      Productivity: 'Review planner load — unfinished planned items are likely dragging output down.',
      'Life Score': 'Identify which Life Score pillar dropped most and address it for one week.',
    }
    recs.push({
      id: `rec-${++id}`,
      basedOn: t.message,
      recommendation: actionMap[t.metric] ?? `Address the decline in ${t.metric.toLowerCase()} before adding new goals.`,
    })
  }

  if (weaknesses.length > 0 && recs.length < 3) {
    const w = weaknesses[0]
    let recommendation = 'Target this area with one measurable daily action for the next 7 days.'
    if (w.label.includes('Habit')) {
      recommendation = 'Shrink this habit to a 2-minute minimum version until consistency rises above 70%.'
    } else if (w.label.includes('Character')) {
      recommendation = `Schedule one deliberate action this week that exercises "${w.detail.split('—')[0]?.trim()}".`
    } else if (w.label.includes('Bottleneck')) {
      recommendation = 'Reallocate 30 minutes tomorrow to the bottleneck area before opening other apps.'
    }
    recs.push({
      id: `rec-${++id}`,
      basedOn: w.detail,
      recommendation,
    })
  }

  return recs.slice(0, 3)
}

export function computeLifeIntelligence(lookbackDays = 90): LifeIntelligenceReport {
  const snapshots = collectDaySnapshots(lookbackDays)
  const hasData = hasAnyLifeData() && snapshots.length >= 3

  if (!hasData) {
    return {
      hasData: false,
      dataDays: snapshots.length,
      personalInsights: [],
      bestPerformance: [],
      weakestAreas: [],
      trends: [],
      patterns: [],
      recommendations: [],
    }
  }

  const personalInsights = buildPersonalInsights(snapshots)
  const bestPerformance = buildBestPerformance(snapshots)
  const weakestAreas = buildWeakestAreas(snapshots)
  const trends = buildTrends(snapshots)
  const patterns = buildPatterns(snapshots)
  const recommendations = buildRecommendations(patterns, weakestAreas, trends)

  return {
    hasData: true,
    dataDays: snapshots.length,
    personalInsights,
    bestPerformance,
    weakestAreas,
    trends,
    patterns,
    recommendations,
  }
}

export type {
  LifeIntelligenceReport,
  IntelligenceInsight,
  PerformancePeak,
  WeakArea,
  TrendInsight,
  PatternLink,
  SmartRecommendation,
} from '@/lib/life-intelligence/types'
