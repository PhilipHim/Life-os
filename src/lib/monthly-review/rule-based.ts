import type { MonthlyReview, MonthlyReviewSnapshot } from '@/lib/monthly-review/types'
import { formatScoreTrend, directionFromChange } from '@/lib/monthly-review/build-snapshot'

function pickMostImproved(s: MonthlyReviewSnapshot): string {
  const areas: { name: string; change: number | null }[] = [
    { name: 'Productivity', change: s.productivity.change },
    { name: 'Life Score', change: s.lifeScore.change },
    { name: 'Sleep', change: s.sleep.change },
    { name: 'Health', change: s.health.change },
    { name: 'Habits', change: pctChange(s.habits.avgScoreThisMonth, s.habits.avgScoreLastMonth) },
  ]
  const valid = areas.filter((a) => a.change != null).sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
  if (valid.length === 0) return 'Consistency in tracking — measurement enables growth.'
  const best = valid[0]
  if ((best.change ?? 0) <= 0) return 'Steady progress — no major gains, but foundations held.'
  return `${best.name} improved ${best.change}% month over month.`
}

function pickNeedsAttention(s: MonthlyReviewSnapshot): string {
  const areas: { name: string; change: number | null; priority: number }[] = [
    { name: 'Productivity', change: s.productivity.change, priority: 70 },
    { name: 'Life Score', change: s.lifeScore.change, priority: 75 },
    { name: 'Sleep', change: s.sleep.change, priority: 85 },
    { name: 'Health', change: s.health.change, priority: 80 },
  ]
  const declining = areas
    .filter((a) => a.change != null && a.change <= -5)
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))

  if (declining.length > 0) {
    return `${declining[0].name} declined ${Math.abs(declining[0].change!)}% — needs strategic focus next month.`
  }

  if (s.sleep.change != null && s.sleep.change < 0) {
    return 'Recovery and sleep quality need attention to sustain performance.'
  }
  if (s.character.weakestTrait) {
    return `${s.character.weakestTrait} development stalled — schedule deliberate growth.`
  }
  if (s.journal.daysThisMonth < 8) {
    return 'Reflection was sparse — journaling would sharpen next month\'s priorities.'
  }
  return 'Maintain current systems while pushing one area 10% further.'
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function buildFinancialSummary(s: MonthlyReviewSnapshot): MonthlyReview['financialProgress'] {
  if (!s.finance.hasData) {
    return { summary: 'No portfolio tracked this month.', monthPct: null, weekPct: null }
  }
  const monthPct = s.finance.portfolioMonthPct
  const weekPct = s.finance.portfolioWeekPct
  let summary = 'Portfolio tracked — '
  if (monthPct != null && monthPct > 0) {
    summary += `up ${monthPct}% this month.`
  } else if (monthPct != null && monthPct < 0) {
    summary += `down ${Math.abs(monthPct)}% this month.`
  } else {
    summary += 'flat performance this month.'
  }
  return { summary, monthPct, weekPct }
}

function buildMonthlySummary(s: MonthlyReviewSnapshot, improved: string, attention: string): string {
  const prodUp = (s.productivity.change ?? 0) >= 5
  const lifeUp = (s.lifeScore.change ?? 0) >= 5
  const charActive = s.character.growth.length >= 2

  if (prodUp && lifeUp && charActive) {
    return `This month showed strong consistency and personal growth. The biggest opportunity next month is ${attention.toLowerCase().replace(/^[^—]+—\s*/i, '')}`
  }
  if (prodUp) {
    return `Productivity gained momentum this month. Protect gains by addressing ${attention.split('—')[0].trim().toLowerCase()}.`
  }
  if ((s.sleep.change ?? 0) <= -5) {
    return 'Output may have come at the cost of recovery. Next month, prioritize sleep before scaling ambition.'
  }
  if (s.character.growth.length > 0) {
    return 'Character development was active this month. Align daily habits with your long-term identity goals.'
  }
  return `A month of ${s.daysTrackedThisMonth} tracked days. ${improved} Focus next on ${attention.split('.')[0].toLowerCase()}.`
}

export function generateRuleBasedMonthlyReview(snapshot: MonthlyReviewSnapshot): MonthlyReview {
  const productivityTrend = formatScoreTrend(
    snapshot.productivity.lastMonthAvg,
    snapshot.productivity.thisMonthAvg,
    snapshot.productivity.change
  )
  const lifeScoreTrend = formatScoreTrend(
    snapshot.lifeScore.lastMonthAvg,
    snapshot.lifeScore.thisMonthAvg,
    snapshot.lifeScore.change
  )
  const sleepTrend = formatScoreTrend(
    snapshot.sleep.lastMonthAvg,
    snapshot.sleep.thisMonthAvg,
    snapshot.sleep.change
  )
  const healthTrend = formatScoreTrend(
    snapshot.health.lastMonthAvg,
    snapshot.health.thisMonthAvg,
    snapshot.health.change
  )

  if (snapshot.sleep.thisMonthAvg == null) {
    sleepTrend.direction = directionFromChange(snapshot.sleep.change)
    sleepTrend.summary = sleepTrend.direction === 'Unknown' ? 'Limited sleep data' : sleepTrend.direction
  } else if (snapshot.sleep.change == null || Math.abs(snapshot.sleep.change) < 3) {
    sleepTrend.summary = snapshot.sleep.lastMonthAvg != null
      ? `${snapshot.sleep.lastMonthAvg} → ${snapshot.sleep.thisMonthAvg}`
      : `${snapshot.sleep.thisMonthAvg}/100 avg`
  }

  if (snapshot.health.thisMonthAvg == null && snapshot.health.change == null) {
    healthTrend.direction = 'Stable'
    healthTrend.summary = 'Stable'
  }

  const mostImprovedArea = pickMostImproved(snapshot)
  const areaNeedingAttention = pickNeedsAttention(snapshot)

  return {
    productivityTrend,
    lifeScoreTrend,
    sleepTrend,
    healthTrend,
    characterGrowth: snapshot.character.growth.length > 0
      ? snapshot.character.growth
      : snapshot.character.strongestTrait
        ? [{ name: snapshot.character.strongestTrait, change: 1 }]
        : [],
    financialProgress: buildFinancialSummary(snapshot),
    mostImprovedArea,
    areaNeedingAttention,
    aiMonthlySummary: buildMonthlySummary(snapshot, mostImprovedArea, areaNeedingAttention),
    generatedAt: Date.now(),
    source: 'rules',
  }
}
