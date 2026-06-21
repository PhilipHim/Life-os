import { getXpState, getXpHistory } from '@/lib/xp/state'
import { computeLevelFromXp, xpToReachLevel, xpIncrementForLevel } from '@/lib/xp/levels'
import { computeProgress } from '@/lib/profile/progression'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface XpGrowthPoint {
  label: string
  date: string
  value: number
}

export interface XpAnalytics {
  progress: ReturnType<typeof computeProgress>
  history: ReturnType<typeof getXpHistory>
  xpGrowthWeek: XpGrowthPoint[]
  xpGrowthMonth: XpGrowthPoint[]
  nextLevelAt: number
  xpRemaining: number
  hasData: boolean
}

export function computeXpAnalytics(): XpAnalytics {
  const state = getXpState()
  const progress = computeProgress(state.totalXp)
  const history = getXpHistory()
  const today = new Date()

  const xpGrowthWeek: XpGrowthPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = dateStr(d)
    xpGrowthWeek.push({
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: ds,
      value: state.daily[ds] ?? 0,
    })
  }

  const xpGrowthMonth: XpGrowthPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = dateStr(d)
    xpGrowthMonth.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: ds,
      value: state.daily[ds] ?? 0,
    })
  }

  return {
    progress,
    history,
    xpGrowthWeek,
    xpGrowthMonth,
    nextLevelAt: xpToReachLevel(progress.level + 1),
    xpRemaining: progress.xpRemaining,
    hasData: state.totalXp > 0 || state.events.length > 0,
  }
}

export { computeLevelFromXp, xpToReachLevel, xpIncrementForLevel }
