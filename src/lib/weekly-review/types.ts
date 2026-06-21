export interface WeeklyReview {
  biggestWin: string
  biggestBottleneck: string
  strongestArea: string
  weakestArea: string
  bestHabit: string
  aiRecommendation: string
  generatedAt: number
  source: 'gemini' | 'rules'
}

export interface WeeklyReviewSnapshot {
  weekLabel: string
  productivity: {
    weeklyAvgScore: number
    trendPct: number | null
    totalTasks: number
    totalFocusMinutes: number
    focusTrendPct: number | null
    bestDay: string | null
  }
  lifeScore: {
    weeklyAvg: number
    trendPct: number | null
    bestDay: string | null
    weakestDay: string | null
  }
  sleep: {
    avgScore: number | null
    weekVsMonthPct: number | null
    trend: string
  }
  health: {
    avgScore: number | null
    trendPct: number | null
    daysWithoutIllness: number
    isSick: boolean
  }
  habits: {
    weeklyAvgScore: number
    trend: number
    bestHabit: { name: string; completionPct: number } | null
    currentStreak: number
  }
  journal: {
    daysLogged: number
    avgMood: number | null
    streak: number
  }
  character: {
    strongestTrait: string | null
    weakestTrait: string | null
    traitsUpdatedThisWeek: number
  }
  finance: {
    portfolioWeekPct: number | null
    hasData: boolean
  }
  dailyScores: { day: string; productivity: number; life: number; tasks: number }[]
}

export interface WeeklyReviewResult {
  review: WeeklyReview
  error?: string
  model?: string
}
