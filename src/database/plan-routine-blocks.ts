import type { PlanRoutineBlock } from '@/types'

const STORAGE_KEY = 'life_os_plan_routine_blocks'

export function getPlanRoutineBlocks(): PlanRoutineBlock[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as PlanRoutineBlock[]
  } catch {
    return []
  }
}

export function savePlanRoutineBlocks(blocks: PlanRoutineBlock[]): PlanRoutineBlock[] {
  if (typeof window === 'undefined') return blocks
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
  return getPlanRoutineBlocks()
}
