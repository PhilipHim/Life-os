import type { JournalEntry, HealthEntry } from '@/types'
import { computeHealthScore } from '@/lib/health-score'
import { getHealthEntryByDate } from '@/database/health'
import { getJournalEntryByDate } from '@/database/journal'

export interface MindScoreResult {
  total: number
  max: number
  journalExists: number
  mood: number
  energy: number
}

export interface LifeScoreResult {
  total: number
  max: number
  productivity: number
  health: number | null
  mind: number
  habits: number
}

function dateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function computeMindScore(
  entry: JournalEntry | null | undefined
): MindScoreResult {
  const journalExists = entry ? 40 : 0
  const mood = entry?.mood != null ? Math.round((entry.mood / 10) * 30) : 0
  const energy = entry?.energy != null ? Math.round((entry.energy / 10) * 30) : 0
  const total = Math.min(journalExists + mood + energy, 100)
  return { total, max: 100, journalExists, mood, energy }
}

function computeProductivityComponent(
  plannerCompletionPct: number,
  focusMinutes: number
): number {
  const plannerScore = Math.min(plannerCompletionPct, 100) * 0.6
  const focusScore = Math.min((focusMinutes / 180) * 100, 100) * 0.4
  return Math.round(plannerScore + focusScore)
}

function computeHabitsComponent(
  buildDone: number,
  buildTotal: number,
  avoidSuccess: number,
  avoidTotal: number
): number {
  const buildPct = buildTotal > 0 ? buildDone / buildTotal : 0
  const avoidPct = avoidTotal > 0 ? avoidSuccess / avoidTotal : 0
  const totalHabits = buildTotal + avoidTotal
  if (totalHabits === 0) return 0
  const weighted = (buildPct * buildTotal + avoidPct * avoidTotal) / totalHabits
  return Math.round(weighted * 100)
}

export function computeLifeScore(
  date: Date,
  extras?: {
    plannerCompletionPct: number
    focusMinutes: number
    buildDone: number
    buildTotal: number
    avoidSuccess: number
    avoidTotal: number
  }
): LifeScoreResult {
  const ds = dateStr(date)
  const healthEntry = getHealthEntryByDate(ds)
  const health = healthEntry ? computeHealthScore(healthEntry).total : null

  const journalEntry = getJournalEntryByDate(ds)
  const mind = computeMindScore(journalEntry).total

  if (!extras) {
    const baseTotal = health != null
      ? Math.round(health * 0.6 + mind * 0.4)
      : mind
    return { total: baseTotal, max: 100, productivity: 0, health, mind, habits: 0 }
  }

  const productivity = computeProductivityComponent(
    extras.plannerCompletionPct,
    extras.focusMinutes
  )
  const habits = computeHabitsComponent(
    extras.buildDone,
    extras.buildTotal,
    extras.avoidSuccess,
    extras.avoidTotal
  )
  const hp = health ?? 50
  const total = Math.round(
    productivity * 0.35 + hp * 0.30 + mind * 0.20 + habits * 0.15
  )

  return { total, max: 100, productivity, health, mind, habits }
}
