import type { TrendDirection } from '@/lib/life-intelligence/types'

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function displayDate(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function weekdayName(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function monthLabel(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function weekLabel(mondayDate: string): string {
  const start = new Date(mondayDate + 'T12:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(12, 0, 0, 0)
  return monday
}

export function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

export function pctDelta(higher: number, lower: number): number | null {
  if (lower === 0) return null
  return Math.round(((higher - lower) / lower) * 100)
}

export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 5) return null
  const n = xs.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const den = Math.sqrt(dx * dy)
  if (den === 0) return null
  return Math.round((num / den) * 100) / 100
}

export function trendDirection(values: number[]): TrendDirection {
  if (values.length < 2) return 'stable'
  const first = values[0]
  const last = values[values.length - 1]
  if (first === 0) return 'stable'
  const change = ((last - first) / first) * 100
  if (change >= 5) return 'improving'
  if (change <= -5) return 'declining'
  return 'stable'
}
