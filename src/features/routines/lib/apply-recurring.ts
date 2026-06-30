import type { PlanRoutineBlock } from '@/types'
import { getPlanRoutineBlocks, savePlanRoutineBlocks } from '@/database/plan-routine-blocks'
import { getRecurringRoutineSchedules } from '@/database/recurring-routine-schedules'
import { computeRecurringOrderIndices } from '@/features/routines/lib/plan-ordering'

/** Inserts enabled recurring routines for a date when not already present. */
export function applyRecurringRoutinesForDate(dateStr: string): PlanRoutineBlock[] {
  const schedules = getRecurringRoutineSchedules().filter((s) => s.enabled)
  if (schedules.length === 0) return getPlanRoutineBlocks()

  const all = getPlanRoutineBlocks()
  const existingRoutineIds = new Set(
    all.filter((b) => b.date === dateStr).map((b) => b.routineId)
  )

  const pending = schedules.filter((s) => !existingRoutineIds.has(s.routineId))
  if (pending.length === 0) return all

  const orderIndices = computeRecurringOrderIndices(
    dateStr,
    pending.map((s) => ({ routineId: s.routineId, placement: s.placement ?? 'manual' }))
  )

  const toAdd: PlanRoutineBlock[] = pending.map((schedule) => ({
    id: crypto.randomUUID(),
    routineId: schedule.routineId,
    date: dateStr,
    orderIndex: orderIndices.get(schedule.routineId) ?? 0,
    estimatedDuration: Math.max(1, schedule.estimatedDuration),
    startTime: schedule.startTime,
    notes: schedule.notes,
    placement: schedule.placement ?? 'manual',
    expanded: true,
    completedSteps: {},
    createdAt: Date.now(),
  }))

  return savePlanRoutineBlocks([...all, ...toAdd])
}
