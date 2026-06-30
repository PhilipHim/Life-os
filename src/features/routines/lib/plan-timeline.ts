import type { ExecutionBlock } from '@/features/planner/lib/planner'
import type { PlanRoutineBlock } from '@/types'

export type PlanTimelineEntry =
  | { kind: 'execution'; block: ExecutionBlock }
  | { kind: 'routine'; block: PlanRoutineBlock }

export function buildPlanTimeline(
  executionQueue: ExecutionBlock[],
  routineBlocks: PlanRoutineBlock[]
): PlanTimelineEntry[] {
  const routines = [...routineBlocks].sort((a, b) => a.orderIndex - b.orderIndex)
  const timeline: PlanTimelineEntry[] = []
  let rIdx = 0

  for (const block of executionQueue) {
    const taskOrder =
      block.kind === 'task' ? block.planItem.orderIndex : Number.MAX_SAFE_INTEGER

    while (rIdx < routines.length && routines[rIdx].orderIndex <= taskOrder) {
      timeline.push({ kind: 'routine', block: routines[rIdx] })
      rIdx++
    }
    timeline.push({ kind: 'execution', block })
  }

  while (rIdx < routines.length) {
    timeline.push({ kind: 'routine', block: routines[rIdx] })
    rIdx++
  }

  return timeline
}
