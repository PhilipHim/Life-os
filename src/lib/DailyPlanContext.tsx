'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { DailyPlanItem } from '@/lib/types'
import { getDailyPlanItems, saveAllDailyPlanItems as persistSaveAll } from '@/lib/db/daily-plan'
import { getPlannerDefaults } from '@/lib/planner-defaults'
import { autoSortPlanItems, orderPlanItems, reindexPlanItems } from '@/lib/planner'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type AutoPlanResult = 'success' | 'no_eligible'

interface DailyPlanContextType {
  planItems: DailyPlanItem[]
  todayPlan: DailyPlanItem[]
  addToPlan: (workItemId: string, priority: 'H1' | 'H2' | 'M' | 'L', estimatedDuration: number) => void
  removeFromPlan: (id: string) => void
  updatePlanItem: (updated: DailyPlanItem) => void
  reorderPlanItems: (orderedIds: string[]) => void
  autoPlanToday: (workItemIds: string[]) => AutoPlanResult
}

const DailyPlanContext = createContext<DailyPlanContextType | null>(null)

export function DailyPlanProvider({ children }: { children: ReactNode }) {
  const [planItems, setPlanItems] = useState<DailyPlanItem[]>([])

  useEffect(() => {
    setPlanItems(getDailyPlanItems())
  }, [])

  const addToPlan = (workItemId: string, priority: 'H1' | 'H2' | 'M' | 'L', estimatedDuration: number) => {
    const all = getDailyPlanItems()
    const todayStr = today()
    const todayItems = orderPlanItems(all.filter((i) => i.date === todayStr))
    const item: DailyPlanItem = {
      id: crypto.randomUUID(),
      workItemId,
      priority,
      estimatedDuration,
      date: todayStr,
      createdAt: Date.now(),
      orderIndex: todayItems.length,
    }
    const normalized = reindexPlanItems([...todayItems, item])
    const otherDays = all.filter((i) => i.date !== todayStr)
    setPlanItems(persistSaveAll([...otherDays, ...normalized]))
  }

  const removeFromPlan = (id: string) => {
    const all = getDailyPlanItems()
    const todayStr = today()
    const remaining = all.filter((i) => i.id !== id)
    const todayItems = reindexPlanItems(remaining.filter((i) => i.date === todayStr))
    const otherDays = remaining.filter((i) => i.date !== todayStr)
    setPlanItems(persistSaveAll([...otherDays, ...todayItems]))
  }

  const updatePlanItem = (updated: DailyPlanItem) => {
    const all = getDailyPlanItems()
    const todayStr = today()
    const todayItems = orderPlanItems(all.filter((i) => i.date === todayStr))
    const otherDays = all.filter((i) => i.date !== todayStr)
    const mergedToday = todayItems.map((i) =>
      i.id === updated.id ? { ...updated, startTime: undefined } : i
    )
    setPlanItems(persistSaveAll([...otherDays, ...mergedToday]))
  }

  const reorderPlanItems = (orderedIds: string[]) => {
    const all = getDailyPlanItems()
    const todayStr = today()
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
    const todayStr = today()
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

  const todayPlan = orderPlanItems(planItems.filter((i) => i.date === today()))

  return (
    <DailyPlanContext.Provider
      value={{
        planItems,
        todayPlan,
        addToPlan,
        removeFromPlan,
        updatePlanItem,
        reorderPlanItems,
        autoPlanToday,
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
