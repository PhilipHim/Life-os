import type { RoutinePlacement } from '@/lib/types'
import { getDailyPlanItems } from '@/lib/db/daily-plan'
import { getPlanRoutineBlocks } from '@/lib/db/plan-routine-blocks'
import { orderPlanItems } from '@/lib/planner'

function getOrderIndicesForDate(dateStr: string, excludeRoutineBlockId?: string): number[] {
  const tasks = orderPlanItems(getDailyPlanItems().filter((i) => i.date === dateStr))
  const routines = getPlanRoutineBlocks().filter(
    (b) => b.date === dateStr && b.id !== excludeRoutineBlockId
  )
  return [...tasks.map((t) => t.orderIndex), ...routines.map((r) => r.orderIndex)]
}

export function getOrderIndexBounds(
  dateStr: string,
  excludeRoutineBlockId?: string
): { min: number; max: number } | null {
  const indices = getOrderIndicesForDate(dateStr, excludeRoutineBlockId)
  if (indices.length === 0) return null
  return { min: Math.min(...indices), max: Math.max(...indices) }
}

/** Initial order index for a single routine block on a given day. */
export function computeOrderIndexForPlacement(
  dateStr: string,
  placement: RoutinePlacement,
  excludeRoutineBlockId?: string
): number {
  const bounds = getOrderIndexBounds(dateStr, excludeRoutineBlockId)
  if (!bounds) return 0
  if (placement === 'first') return bounds.min - 1
  if (placement === 'last') return bounds.max + 1
  const boundsWithSelf = getOrderIndexBounds(dateStr)
  return (boundsWithSelf?.max ?? -1) + 1
}

/** Assign order indices when auto-inserting multiple recurring routines at once. */
export function computeRecurringOrderIndices(
  dateStr: string,
  schedules: { routineId: string; placement: RoutinePlacement }[]
): Map<string, number> {
  const bounds = getOrderIndexBounds(dateStr)
  let min = bounds?.min ?? 0
  let max = bounds?.max ?? -1

  const result = new Map<string, number>()
  const first = schedules.filter((s) => s.placement === 'first')
  const last = schedules.filter((s) => s.placement === 'last')
  const manual = schedules.filter((s) => s.placement === 'manual')

  for (let i = 0; i < first.length; i++) {
    result.set(first[i].routineId, min - (first.length - i))
  }

  for (const s of last) {
    max += 1
    result.set(s.routineId, max)
  }

  for (const s of manual) {
    max += 1
    result.set(s.routineId, max)
  }

  return result
}

export type TimelineOrderEntry = { kind: 'task' | 'routine'; id: string }
