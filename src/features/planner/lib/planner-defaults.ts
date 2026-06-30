const STORAGE_KEY = 'life_os_planner_defaults'

export interface PlannerTaskDefaults {
  priority: 'H1' | 'H2' | 'M' | 'L'
  estimatedDuration: number
}

const FALLBACK: PlannerTaskDefaults = { priority: 'M', estimatedDuration: 30 }

function loadAll(): Record<string, PlannerTaskDefaults> {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, PlannerTaskDefaults>
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, PlannerTaskDefaults>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getPlannerDefaults(workItemId: string): PlannerTaskDefaults {
  return loadAll()[workItemId] ?? { ...FALLBACK }
}

export function setPlannerDefaults(workItemId: string, defaults: PlannerTaskDefaults): void {
  const all = loadAll()
  all[workItemId] = defaults
  saveAll(all)
}

export function removePlannerDefaults(workItemId: string): void {
  const all = loadAll()
  delete all[workItemId]
  saveAll(all)
}
