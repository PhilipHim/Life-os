import type { WeeklyReview, WeeklyReviewSnapshot } from '@/lib/weekly-review/types'

function pickBiggestWin(s: WeeklyReviewSnapshot): string {
  const wins: { score: number; text: string }[] = []

  if (s.productivity.totalTasks >= 5) {
    wins.push({
      score: s.productivity.totalTasks,
      text: `Completed ${s.productivity.totalTasks} tasks this week with an average productivity score of ${s.productivity.weeklyAvgScore}/100.`,
    })
  }

  if (s.productivity.trendPct != null && s.productivity.trendPct >= 8) {
    wins.push({
      score: 80 + s.productivity.trendPct,
      text: `Productivity improved by ${s.productivity.trendPct}% compared to last week.`,
    })
  }

  if (s.productivity.totalFocusMinutes >= 300) {
    wins.push({
      score: 70,
      text: `Logged ${Math.round(s.productivity.totalFocusMinutes / 60)} hours of focused work this week.`,
    })
  }

  if (s.habits.bestHabit && s.habits.bestHabit.completionPct >= 85) {
    wins.push({
      score: 75 + s.habits.bestHabit.completionPct / 10,
      text: `"${s.habits.bestHabit.name}" maintained a ${s.habits.bestHabit.completionPct}% completion rate.`,
    })
  }

  if (s.journal.daysLogged >= 5) {
    wins.push({
      score: 65,
      text: `Journaled on ${s.journal.daysLogged} days — strong reflection consistency.`,
    })
  }

  if (s.health.daysWithoutIllness >= 7 && !s.health.isSick) {
    wins.push({
      score: 60,
      text: `Maintained ${s.health.daysWithoutIllness} days without illness.`,
    })
  }

  if (s.lifeScore.trendPct != null && s.lifeScore.trendPct >= 5) {
    wins.push({
      score: 72,
      text: `Life Score trended up ${s.lifeScore.trendPct}% — balance is improving.`,
    })
  }

  const highScoreDays = s.dailyScores.filter((d) => d.productivity >= 70).length
  if (highScoreDays >= 3) {
    wins.push({
      score: 68 + highScoreDays,
      text: `Hit strong productivity scores (${highScoreDays} days at 70+).`,
    })
  }

  if (wins.length === 0) {
    return 'You showed up and tracked your week — consistency in measurement is the first step to improvement.'
  }

  return wins.sort((a, b) => b.score - a.score)[0].text
}

function pickBiggestBottleneck(s: WeeklyReviewSnapshot): string {
  const issues: { score: number; text: string }[] = []

  if (s.sleep.trend === 'declining' || (s.sleep.weekVsMonthPct != null && s.sleep.weekVsMonthPct <= -5)) {
    issues.push({
      score: 90,
      text: 'Sleep consistency declined significantly — recovery is limiting your output.',
    })
  }

  if (s.health.trendPct != null && s.health.trendPct <= -8) {
    issues.push({
      score: 85,
      text: `Health metrics decreased ${Math.abs(s.health.trendPct)}% this week.`,
    })
  }

  if (s.habits.trend < -5 || s.habits.weeklyAvgScore < 50) {
    issues.push({
      score: 78,
      text: 'Habit consistency dropped — daily routines are not anchoring your progress.',
    })
  }

  if (s.productivity.trendPct != null && s.productivity.trendPct <= -10) {
    issues.push({
      score: 82,
      text: `Productivity fell ${Math.abs(s.productivity.trendPct)}% — execution slipped.`,
    })
  }

  if (s.journal.daysLogged <= 2) {
    issues.push({
      score: 55,
      text: 'Journal engagement was low — less reflection means less clarity on priorities.',
    })
  }

  if (s.health.isSick) {
    issues.push({
      score: 95,
      text: 'You were sick this week — recovery should take priority over output.',
    })
  }

  if (issues.length === 0) {
    return 'No major bottleneck detected — protect your current routines to maintain momentum.'
  }

  return issues.sort((a, b) => b.score - a.score)[0].text
}

function pickStrongestWeakest(s: WeeklyReviewSnapshot): { strongest: string; weakest: string } {
  const areas: { name: string; score: number; trend: number | null }[] = [
    { name: 'Productivity', score: s.productivity.weeklyAvgScore, trend: s.productivity.trendPct },
    { name: 'Life Score', score: s.lifeScore.weeklyAvg, trend: s.lifeScore.trendPct },
    { name: 'Habits', score: s.habits.weeklyAvgScore, trend: s.habits.trend },
  ]

  if (s.health.avgScore != null) {
    areas.push({ name: 'Health', score: s.health.avgScore, trend: s.health.trendPct })
  }
  if (s.sleep.avgScore != null) {
    areas.push({ name: 'Sleep', score: s.sleep.avgScore, trend: s.sleep.weekVsMonthPct })
  }

  const withTrend = areas.filter((a) => a.trend != null)
  if (withTrend.length >= 2) {
    const sorted = [...withTrend].sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0))
    const strongest = sorted[0]
    const weakest = sorted[sorted.length - 1]
    const strongestText = strongest.trend! > 0
      ? `${strongest.name} improved by ${strongest.trend}%.`
      : `${strongest.name} was your most stable area this week.`
    const weakestText = weakest.trend! < 0
      ? `${weakest.name} metrics decreased this week (${weakest.trend}%).`
      : `${weakest.name} needs the most attention going forward.`
    return { strongest: strongestText, weakest: weakestText }
  }

  const byScore = [...areas].sort((a, b) => b.score - a.score)
  return {
    strongest: `${byScore[0].name} led your week at ${byScore[0].score}/100 average.`,
    weakest: `${byScore[byScore.length - 1].name} was your lowest-scoring area.`,
  }
}

function pickBestHabit(s: WeeklyReviewSnapshot): string {
  if (s.habits.bestHabit) {
    const { name, completionPct } = s.habits.bestHabit
    if (completionPct >= 100) {
      return `"${name}" maintained a 100% completion rate this week.`
    }
    return `"${name}" was your strongest habit at ${completionPct}% completion.`
  }
  if (s.habits.currentStreak >= 3) {
    return `Habit tracking streak of ${s.habits.currentStreak} days — consistency is building.`
  }
  return 'No habit data logged this week — start tracking one daily habit.'
}

function pickRecommendation(s: WeeklyReviewSnapshot, bottleneck: string): string {
  if (bottleneck.includes('Sleep')) {
    return 'Focus on improving bedtime consistency next week.'
  }
  if (bottleneck.includes('Health') || s.health.isSick) {
    return 'Prioritize recovery, hydration, and movement before pushing productivity.'
  }
  if (bottleneck.includes('Habit')) {
    return 'Pick one habit and commit to 80% completion before adding anything new.'
  }
  if (bottleneck.includes('Productivity')) {
    return 'Reduce your daily plan to three priorities and finish them before adding work.'
  }
  if (bottleneck.includes('Journal')) {
    return 'Journal for five minutes each evening to clarify tomorrow\'s focus.'
  }
  if (s.character.weakestTrait) {
    return `Invest one concrete action in ${s.character.weakestTrait} next week.`
  }
  return 'Protect what worked this week and double down on your strongest routine.'
}

export function generateRuleBasedWeeklyReview(snapshot: WeeklyReviewSnapshot): WeeklyReview {
  const bottleneck = pickBiggestBottleneck(snapshot)
  const { strongest, weakest } = pickStrongestWeakest(snapshot)

  return {
    biggestWin: pickBiggestWin(snapshot),
    biggestBottleneck: bottleneck,
    strongestArea: strongest,
    weakestArea: weakest,
    bestHabit: pickBestHabit(snapshot),
    aiRecommendation: pickRecommendation(snapshot, bottleneck),
    generatedAt: Date.now(),
    source: 'rules',
  }
}
