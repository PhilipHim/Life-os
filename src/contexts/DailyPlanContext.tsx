'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { DailyPlanItem, PlanRoutineBlock, RecurringRoutineSchedule, RoutinePlacement } from '@/types'
import { getDailyPlanItems, saveAllDailyPlanItems as persistSaveAll } from '@/database/daily-plan'
import {
  getPlanRoutineBlocks,
  savePlanRoutineBlocks,
} from '@/database/plan-routine-blocks'
import {
  getRecurringRoutineSchedules,
  upsertRecurringRoutineSchedule as persistUpsertRecurring,
} from '@/database/recurring-routine-schedules'
import { getPlannerDefaults } from '@/features/planner/lib/planner-defaults'
import { autoSortPlanItems, orderPlanItems, reindexPlanItems } from '@/features/planner/lib/planner'
import { localDateStr } from '@/utils/date'
import { applyRecurringRoutinesForDate } from '@/features/routines/lib/apply-recurring'
import { computeOrderIndexForPlacement, type TimelineOrderEntry } from '@/features/routines/lib/plan-ordering'

export type AutoPlanResult = 'success' | 'no_eligible'

export interface AddRoutineToPlanOptions {
  date?: string
  placement?: RoutinePlacement
  startTime?: string
  notes?: string
}

export interface UpsertRecurringRoutineOptions {
  routineId: string
  estimatedDuration: number
  placement: RoutinePlacement
  startTime?: string
  notes?: string
  enabled: boolean
}

interface DailyPlanContextType {
  planItems: DailyPlanItem[]
  todayPlan: DailyPlanItem[]
  planRoutineBlocks: PlanRoutineBlock[]
  todayRoutineBlocks: PlanRoutineBlock[]
  recurringRoutineSchedules: RecurringRoutineSchedule[]
  addToPlan: (workItemId: string, priority: 'H1' | 'H2' | 'M' | 'L', estimatedDuration: number) => void
  removeFromPlan: (id: string) => void
  updatePlanItem: (updated: DailyPlanItem) => void
  reorderPlanItems: (orderedIds: string[]) => void
  autoPlanToday: (workItemIds: string[]) => AutoPlanResult
  addRoutineToPlan: (
    routineId: string,
    estimatedDuration: number,
    options?: AddRoutineToPlanOptions
  ) => void
  removeRoutineFromPlan: (id: string) => void
  updatePlanRoutineBlock: (updated: PlanRoutineBlock) => void
  toggleRoutineStepComplete: (blockId: string, stepKey: string, completed: boolean) => void
  getRecurringScheduleForRoutine: (routineId: string) => RecurringRoutineSchedule | undefined
  upsertRecurringRoutine: (options: UpsertRecurringRoutineOptions) => void
  disableRecurringRoutine: (routineId: string) => void
  updateRoutineOnPlan: (
    dateStr: string,
    routineId: string,
    updates: { estimatedDuration: number; placement: RoutinePlacement },
    options?: { reposition?: boolean }
  ) => boolean
  reorderPlanTimeline: (orderedEntries: TimelineOrderEntry[]) => void
}

const DailyPlanContext = createContext<DailyPlanContextType | null>(null)

function nextOrderIndex(dateStr: string): number {
  const taskMax = orderPlanItems(getDailyPlanItems().filter((i) => i.date === dateStr)).at(-1)
    ?.orderIndex ?? -1
  const routineMax = getPlanRoutineBlocks()
    .filter((b) => b.date === dateStr)
    .reduce((max, b) => Math.max(max, b.orderIndex), -1)
  return Math.max(taskMax, routineMax) + 1
}

export function DailyPlanProvider({ children }: { children: ReactNode }) {
  const [planItems, setPlanItems] = useState<DailyPlanItem[]>([])
  const [planRoutineBlocks, setPlanRoutineBlocks] = useState<PlanRoutineBlock[]>([])
  const [recurringRoutineSchedules, setRecurringRoutineSchedules] = useState<
    RecurringRoutineSchedule[]
  >([])

  useEffect(() => {
    setPlanItems(getDailyPlanItems())
    const applied = applyRecurringRoutinesForDate(localDateStr())
    setPlanRoutineBlocks(applied)
    setRecurringRoutineSchedules(getRecurringRoutineSchedules())
  }, [])

  const todayStr = localDateStr()
  const todayPlan = orderPlanItems(planItems.filter((i) => i.date === todayStr))
  const todayRoutineBlocks = [...planRoutineBlocks.filter((b) => b.date === todayStr)].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  const getRecurringScheduleForRoutine = (routineId: string) =>
    recurringRoutineSchedules.find((s) => s.routineId === routineId && s.enabled)

  const addToPlan = (workItemId: string, priority: 'H1' | 'H2' | 'M' | 'L', estimatedDuration: number) => {
    const all = getDailyPlanItems()
    const todayItems = orderPlanItems(all.filter((i) => i.date === todayStr))
    const item: DailyPlanItem = {
      id: crypto.randomUUID(),
      workItemId,
      priority,
      estimatedDuration,
      date: todayStr,
      createdAt: Date.now(),
      orderIndex: nextOrderIndex(todayStr),
    }
    const normalized = reindexPlanItems([...todayItems, item])
    const otherDays = all.filter((i) => i.date !== todayStr)
    setPlanItems(persistSaveAll([...otherDays, ...normalized]))
  }

  const removeFromPlan = (id: string) => {
    const all = getDailyPlanItems()
    const remaining = all.filter((i) => i.id !== id)
    const todayItems = reindexPlanItems(remaining.filter((i) => i.date === todayStr))
    const otherDays = remaining.filter((i) => i.date !== todayStr)
    setPlanItems(persistSaveAll([...otherDays, ...todayItems]))
  }

  const updatePlanItem = (updated: DailyPlanItem) => {
    const all = getDailyPlanItems()
    const todayItems = orderPlanItems(all.filter((i) => i.date === todayStr))
    const otherDays = all.filter((i) => i.date !== todayStr)
    const mergedToday = todayItems.map((i) =>
      i.id === updated.id ? { ...updated, startTime: undefined } : i
    )
    setPlanItems(persistSaveAll([...otherDays, ...mergedToday]))
  }

  const reorderPlanItems = (orderedIds: string[]) => {
    const all = getDailyPlanItems()
    const todayItems = orderPlanItems(all.filter((i) => i.date === todayStr))
    const byId = new Map(todayItems.map((i) => [i.id, i]))
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as DailyPlanItem[]
    const missing = todayItems.filter((i) => !orderedIds.includes(i.id))
    const normalized = reindexPlanItems([...reordered, ...missing])
    const otherDays = all.filter((i) => i.date !== todayStr)
    setPlanItems(persistSaveAll([...otherDays, ...normalized]))
  }

  const autoPlanToday = (workItemIds: string[]): AutoPlanResult => {
    if (workItemIds.length === 0) return 'no_eligible'

    const all = getDailyPlanItems()
    const existingToday = orderPlanItems(all.filter((i) => i.date === todayStr))
    const existingByWorkId = new Map(existingToday.map((i) => [i.workItemId, i]))

    const items: DailyPlanItem[] = workItemIds.map((workItemId) => {
      const existing = existingByWorkId.get(workItemId)
      if (existing) return existing

      const defaults = getPlannerDefaults(workItemId)
      return {
        id: crypto.randomUUID(),
        workItemId,
        priority: defaults.priority,
        estimatedDuration: defaults.estimatedDuration,
        date: todayStr,
        createdAt: Date.now(),
        orderIndex: 0,
      }
    })

    const sorted = autoSortPlanItems(items)
    const otherDays = all.filter((i) => i.date !== todayStr)
    setPlanItems(persistSaveAll([...otherDays, ...sorted]))
    return 'success'
  }

  const addRoutineToPlan = (
    routineId: string,
    estimatedDuration: number,
    options?: AddRoutineToPlanOptions
  ) => {
    const date = options?.date ?? todayStr
    const placement = options?.placement ?? 'manual'
    const all = getPlanRoutineBlocks()
    const block: PlanRoutineBlock = {
      id: crypto.randomUUID(),
      routineId,
      date,
      orderIndex: computeOrderIndexForPlacement(date, placement),
      estimatedDuration: Math.max(1, estimatedDuration),
      startTime: options?.startTime || undefined,
      notes: options?.notes?.trim() || undefined,
      placement,
      expanded: true,
      completedSteps: {},
      createdAt: Date.now(),
    }
    setPlanRoutineBlocks(savePlanRoutineBlocks([...all, block]))
  }

  const repositionRoutineOnPlan = (
    dateStr: string,
    routineId: string,
    placement: RoutinePlacement
  ) => {
    if (placement === 'manual') return

    const all = getPlanRoutineBlocks()
    const block = all.find((b) => b.date === dateStr && b.routineId === routineId)
    if (!block) return

    const newOrderIndex = computeOrderIndexForPlacement(dateStr, placement, block.id)
    setPlanRoutineBlocks(
      savePlanRoutineBlocks(
        all.map((b) =>
          b.id === block.id ? { ...b, orderIndex: newOrderIndex, placement } : b
        )
      )
    )
  }

  const updateRoutineOnPlan = (
    dateStr: string,
    routineId: string,
    updates: { estimatedDuration: number; placement: RoutinePlacement },
    options?: { reposition?: boolean }
  ) => {
    const all = getPlanRoutineBlocks()
    const block = all.find((b) => b.date === dateStr && b.routineId === routineId)
    if (!block) return false

    let orderIndex = block.orderIndex
    let placement = updates.placement

    if (options?.reposition && placement !== 'manual') {
      orderIndex = computeOrderIndexForPlacement(dateStr, placement, block.id)
    }

    setPlanRoutineBlocks(
      savePlanRoutineBlocks(
        all.map((b) =>
          b.id === block.id
            ? {
                ...b,
                estimatedDuration: Math.max(1, updates.estimatedDuration),
                placement,
                orderIndex,
              }
            : b
        )
      )
    )
    return true
  }

  const removeRoutineFromPlan = (id: string) => {
    setPlanRoutineBlocks(savePlanRoutineBlocks(getPlanRoutineBlocks().filter((b) => b.id !== id)))
  }

  const updatePlanRoutineBlock = (updated: PlanRoutineBlock) => {
    setPlanRoutineBlocks(
      savePlanRoutineBlocks(
        getPlanRoutineBlocks().map((b) => (b.id === updated.id ? updated : b))
      )
    )
  }

  const toggleRoutineStepComplete = (blockId: string, stepKey: string, completed: boolean) => {
    const block = getPlanRoutineBlocks().find((b) => b.id === blockId)
    if (!block) return
    const completedSteps = { ...block.completedSteps }
    if (completed) completedSteps[stepKey] = true
    else delete completedSteps[stepKey]
    updatePlanRoutineBlock({ ...block, completedSteps })
  }

  const upsertRecurringRoutine = (options: UpsertRecurringRoutineOptions) => {
    const existing = getRecurringRoutineSchedules().find((s) => s.routineId === options.routineId)
    const placementChanged = !!existing && existing.placement !== options.placement
    const now = Date.now()
    const schedule: RecurringRoutineSchedule = {
      id: existing?.id ?? crypto.randomUUID(),
      routineId: options.routineId,
      estimatedDuration: Math.max(1, options.estimatedDuration),
      placement: options.placement,
      startTime: options.startTime || undefined,
      notes: options.notes?.trim() || undefined,
      enabled: options.enabled,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    setRecurringRoutineSchedules(persistUpsertRecurring(schedule))

    if (options.enabled) {
      const applied = applyRecurringRoutinesForDate(todayStr)
      setPlanRoutineBlocks(applied)
    }

    if (placementChanged && options.placement !== 'manual') {
      repositionRoutineOnPlan(todayStr, options.routineId, options.placement)
    }
  }

  const disableRecurringRoutine = (routineId: string) => {
    const existing = getRecurringRoutineSchedules().find((s) => s.routineId === routineId)
    if (!existing) return
    setRecurringRoutineSchedules(
      persistUpsertRecurring({ ...existing, enabled: false, updatedAt: Date.now() })
    )
  }

  const reorderPlanTimeline = (orderedEntries: TimelineOrderEntry[]) => {
    const taskOrder = new Map<string, number>()
    const routineOrder = new Map<string, number>()
    orderedEntries.forEach((entry, index) => {
      if (entry.kind === 'task') taskOrder.set(entry.id, index)
      else routineOrder.set(entry.id, index)
    })

    const all = getDailyPlanItems()
    const todayItems = orderPlanItems(all.filter((i) => i.date === todayStr))
    const otherDays = all.filter((i) => i.date !== todayStr)
    const updatedToday = todayItems.map((item) => {
      const index = taskOrder.get(item.id)
      if (index === undefined) return item
      return { ...item, orderIndex: index, startTime: undefined }
    })
    setPlanItems(persistSaveAll([...otherDays, ...updatedToday]))

    const updatedBlocks = getPlanRoutineBlocks().map((block) => {
      if (block.date !== todayStr) return block
      const index = routineOrder.get(block.id)
      if (index === undefined) return block
      return { ...block, orderIndex: index }
    })
    setPlanRoutineBlocks(savePlanRoutineBlocks(updatedBlocks))
  }

  return (
    <DailyPlanContext.Provider
      value={{
        planItems,
        todayPlan,
        planRoutineBlocks,
        todayRoutineBlocks,
        recurringRoutineSchedules,
        addToPlan,
        removeFromPlan,
        updatePlanItem,
        reorderPlanItems,
        autoPlanToday,
        addRoutineToPlan,
        removeRoutineFromPlan,
        updatePlanRoutineBlock,
        toggleRoutineStepComplete,
        getRecurringScheduleForRoutine,
        upsertRecurringRoutine,
        disableRecurringRoutine,
        updateRoutineOnPlan,
        reorderPlanTimeline,
      }}
    >
      {children}
    </DailyPlanContext.Provider>
  )
}

export function useDailyPlan() {
  const context = useContext(DailyPlanContext)
  if (!context) {
    throw new Error('useDailyPlan must be used within a DailyPlanProvider')
  }
  return context
}
