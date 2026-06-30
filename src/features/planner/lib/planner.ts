import type { DailyPlanItem } from '@/types'

const PRIORITY_ORDER: Record<string, number> = { H1: 0, H2: 1, M: 2, L: 3 }

export const WORK_BLOCK_THRESHOLD_MINUTES = 60
export const AUTO_BREAK_DURATION_MINUTES = 15

export function orderPlanItems(items: DailyPlanItem[]): DailyPlanItem[] {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex)
}

export function reindexPlanItems(items: DailyPlanItem[]): DailyPlanItem[] {
  return orderPlanItems(items).map((item, index) => ({
    ...item,
    orderIndex: index,
    startTime: undefined,
  }))
}

export function compareForAutoPlan(a: DailyPlanItem, b: DailyPlanItem): number {
  const aPri = PRIORITY_ORDER[a.priority] ?? 9
  const bPri = PRIORITY_ORDER[b.priority] ?? 9
  if (aPri !== bPri) return aPri - bPri

  if (a.estimatedDuration !== b.estimatedDuration) {
    return b.estimatedDuration - a.estimatedDuration
  }

  return a.createdAt - b.createdAt
}

export function autoSortPlanItems(items: DailyPlanItem[]): DailyPlanItem[] {
  return reindexPlanItems([...items].sort(compareForAutoPlan))
}

export interface ExecutionTaskBlock {
  kind: 'task'
  planItem: DailyPlanItem
  title: string
}

export interface ExecutionBreakBlock {
  kind: 'break'
  id: string
  durationMinutes: number
  auto: boolean
  afterPlanItemId: string | null
}

export type ExecutionBlock = ExecutionTaskBlock | ExecutionBreakBlock

export function autoBreakKey(beforePlanItemId: string): string {
  return `auto-before-${beforePlanItemId}`
}

export function buildExecutionQueue(
  tasks: DailyPlanItem[],
  getTitle: (workItemId: string) => string,
  options: {
    hiddenAutoBreaks: string[]
    manualBreaks: { id: string; afterPlanItemId: string | null; durationMinutes: number }[]
  }
): ExecutionBlock[] {
  const ordered = orderPlanItems(tasks)
  const blocks: ExecutionBlock[] = []
  let accumulatedWork = 0

  for (let i = 0; i < ordered.length; i++) {
    const task = ordered[i]
    const hasMoreTasks = i < ordered.length - 1

    if (accumulatedWork >= WORK_BLOCK_THRESHOLD_MINUTES && hasMoreTasks) {
      const key = autoBreakKey(task.id)
      if (!options.hiddenAutoBreaks.includes(key)) {
        blocks.push({
          kind: 'break',
          id: key,
          durationMinutes: AUTO_BREAK_DURATION_MINUTES,
          auto: true,
          afterPlanItemId: i > 0 ? ordered[i - 1].id : null,
        })
        accumulatedWork = 0
      }
    }

    blocks.push({
      kind: 'task',
      planItem: task,
      title: getTitle(task.workItemId),
    })
    accumulatedWork += task.estimatedDuration
  }

  for (const manual of options.manualBreaks) {
    const breakBlock: ExecutionBreakBlock = {
      kind: 'break',
      id: manual.id,
      durationMinutes: manual.durationMinutes,
      auto: false,
      afterPlanItemId: manual.afterPlanItemId,
    }

    if (manual.afterPlanItemId == null) {
      blocks.unshift(breakBlock)
      continue
    }

    const taskIdx = blocks.findIndex(
      (b) => b.kind === 'task' && b.planItem.id === manual.afterPlanItemId
    )
    if (taskIdx === -1) {
      blocks.push(breakBlock)
    } else {
      blocks.splice(taskIdx + 1, 0, breakBlock)
    }
  }

  return blocks
}

export function summarizeExecution(
  tasks: DailyPlanItem[],
  blocks: ExecutionBlock[]
): {
  totalTasks: number
  totalWorkMinutes: number
  breakCount: number
  totalBreakMinutes: number
} {
  const totalWorkMinutes = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0)
  const breakBlocks = blocks.filter((b): b is ExecutionBreakBlock => b.kind === 'break')
  return {
    totalTasks: tasks.length,
    totalWorkMinutes,
    breakCount: breakBlocks.length,
    totalBreakMinutes: breakBlocks.reduce((sum, b) => sum + b.durationMinutes, 0),
  }
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
