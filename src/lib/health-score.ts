import type { HealthEntry } from '@/types'

export interface HealthSubScore {
  label: string
  score: number
  max: number
  value: number
  unit: string
}

export interface HealthScoreResult {
  total: number
  max: number
  steps: HealthSubScore
  water: HealthSubScore
  workout: HealthSubScore
  nutrition: HealthSubScore
}

export interface LifeScoreComponent {
  label: string
  score: number
  max: number
  weight: number
  breakdown: { label: string; score: number; max: number }[]
}

const TARGETS = {
  steps: { max: 10000, points: 30, unit: 'steps' },
  water: { max: 3, points: 20, unit: 'L' },
  workout: { max: 60, points: 30, unit: 'min' },
  nutrition: { max: 10, points: 20, unit: '/10' },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function computeHealthScore(entry: HealthEntry): HealthScoreResult {
  const stepsPts = entry.steps != null
    ? Math.round((clamp(entry.steps, 0, TARGETS.steps.max) / TARGETS.steps.max) * TARGETS.steps.points)
    : 0
  const waterPts = entry.waterIntake != null
    ? Math.round((clamp(entry.waterIntake, 0, TARGETS.water.max) / TARGETS.water.max) * TARGETS.water.points)
    : 0
  const workoutPts = entry.workoutMinutes != null
    ? Math.round((clamp(entry.workoutMinutes, 0, TARGETS.workout.max) / TARGETS.workout.max) * TARGETS.workout.points)
    : 0
  const nutritionPts = entry.healthyEatingRating != null
    ? Math.round((clamp(entry.healthyEatingRating, 0, TARGETS.nutrition.max) / TARGETS.nutrition.max) * TARGETS.nutrition.points)
    : 0

  const total = Math.min(stepsPts + waterPts + workoutPts + nutritionPts, 100)

  return {
    total,
    max: 100,
    steps: { label: 'Steps', score: stepsPts, max: TARGETS.steps.points, value: entry.steps ?? 0, unit: TARGETS.steps.unit },
    water: { label: 'Water', score: waterPts, max: TARGETS.water.points, value: entry.waterIntake ?? 0, unit: TARGETS.water.unit },
    workout: { label: 'Workout', score: workoutPts, max: TARGETS.workout.points, value: entry.workoutMinutes ?? 0, unit: TARGETS.workout.unit },
    nutrition: { label: 'Nutrition', score: nutritionPts, max: TARGETS.nutrition.points, value: entry.healthyEatingRating ?? 0, unit: TARGETS.nutrition.unit },
  }
}

export function getHealthRating(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Poor'
}

export function healthScoreToLifeComponent(result: HealthScoreResult): LifeScoreComponent {
  return {
    label: 'Health',
    score: result.total,
    max: result.max,
    weight: 30,
    breakdown: [
      { label: result.steps.label, score: result.steps.score, max: result.steps.max },
      { label: result.water.label, score: result.water.score, max: result.water.max },
      { label: result.workout.label, score: result.workout.score, max: result.workout.max },
      { label: result.nutrition.label, score: result.nutrition.score, max: result.nutrition.max },
    ],
  }
}
