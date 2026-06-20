import type { TrendDirection, TrendMetric, CoachCategory } from '@/lib/coach/types'

const STABLE_THRESHOLD = 3

export function computeTrendDirection(values: number[]): TrendDirection {
  const filtered = values.filter((v) => v > 0)
  if (filtered.length < 2) return 'stable'

  const firstHalf = filtered.slice(0, Math.ceil(filtered.length / 2))
  const secondHalf = filtered.slice(Math.ceil(filtered.length / 2))
  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
  const delta = avgSecond - avgFirst
  const pctChange = avgFirst > 0 ? (delta / avgFirst) * 100 : 0

  if (pctChange <= -STABLE_THRESHOLD) return 'declining'
  if (pctChange >= STABLE_THRESHOLD) return 'improving'
  return 'stable'
}

export function countConsecutiveDecline(values: number[]): number {
  if (values.length < 2) return 0
  let streak = 0
  for (let i = values.length - 1; i > 0; i--) {
    if (values[i] < values[i - 1]) streak++
    else break
  }
  return streak
}

export function buildTrendMetric(
  label: string,
  category: CoachCategory,
  values: number[],
  unit: 'score' | 'percent' = 'score'
): TrendMetric {
  return {
    label,
    category,
    values: values.slice(-4),
    direction: computeTrendDirection(values),
    unit,
  }
}
