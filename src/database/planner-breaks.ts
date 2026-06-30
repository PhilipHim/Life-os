export interface ManualBreak {
  id: string
  afterPlanItemId: string | null
  durationMinutes: number
}

export interface PlannerBreakState {
  date: string
  hiddenAutoBreaks: string[]
  manualBreaks: ManualBreak[]
}

const STORAGE_KEY = 'life_os_planner_breaks'

function loadAll(): Record<string, PlannerBreakState> {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, PlannerBreakState>
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, PlannerBreakState>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getPlannerBreakState(date: string): PlannerBreakState {
  const stored = loadAll()[date]
  return stored ?? { date, hiddenAutoBreaks: [], manualBreaks: [] }
}

export function savePlannerBreakState(state: PlannerBreakState): PlannerBreakState {
  const all = loadAll()
  all[state.date] = state
  saveAll(all)
  return state
}

export function hideAutoBreak(date: string, breakKey: string): PlannerBreakState {
  const state = getPlannerBreakState(date)
  if (state.hiddenAutoBreaks.includes(breakKey)) return state
  return savePlannerBreakState({
    ...state,
    hiddenAutoBreaks: [...state.hiddenAutoBreaks, breakKey],
  })
}

export function addManualBreak(
  date: string,
  afterPlanItemId: string | null,
  durationMinutes = 15
): PlannerBreakState {
  const state = getPlannerBreakState(date)
  return savePlannerBreakState({
    ...state,
    manualBreaks: [
      ...state.manualBreaks,
      { id: crypto.randomUUID(), afterPlanItemId, durationMinutes },
    ],
  })
}

export function removeBreak(date: string, breakId: string, auto: boolean): PlannerBreakState {
  const state = getPlannerBreakState(date)
  if (auto) {
    return savePlannerBreakState({
      ...state,
      hiddenAutoBreaks: [...state.hiddenAutoBreaks, breakId],
    })
  }
  return savePlannerBreakState({
    ...state,
    manualBreaks: state.manualBreaks.filter((b) => b.id !== breakId),
  })
}

export function resetPlannerBreaks(date: string): PlannerBreakState {
  return savePlannerBreakState({ date, hiddenAutoBreaks: [], manualBreaks: [] })
}
