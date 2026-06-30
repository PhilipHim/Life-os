import type { WakeTimeResult } from '@/lib/sleep-optimizer'

export interface SleepPlan {
  id: string
  date: string
  plannedBedtime: string
  calculatedOptions: WakeTimeResult[]
  selectedWakeTime: string | null
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'life_os_sleep_plans'

export function getSleepPlans(): SleepPlan[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SleepPlan[]
  } catch {
    return []
  }
}

function savePlans(plans: SleepPlan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
}

export function getSleepPlanByDate(date: string): SleepPlan | undefined {
  return getSleepPlans().find((p) => p.date === date)
}

export function saveSleepPlan(plan: SleepPlan): SleepPlan[] {
  const plans = getSleepPlans()
  const idx = plans.findIndex((p) => p.id === plan.id)
  if (idx >= 0) {
    plans[idx] = plan
  } else {
    plans.push(plan)
  }
  savePlans(plans)
  return getSleepPlans()
}

export function deleteSleepPlan(id: string): SleepPlan[] {
  savePlans(getSleepPlans().filter((p) => p.id !== id))
  return getSleepPlans()
}
