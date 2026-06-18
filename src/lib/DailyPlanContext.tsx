'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { DailyPlanItem } from '@/lib/types'
import {
  getDailyPlanItems,
  addDailyPlanItem as persistAdd,
  removeDailyPlanItem as persistRemove,
  updateDailyPlanItem as persistUpdate,
  saveAllDailyPlanItems as persistSaveAll,
} from '@/lib/db/daily-plan'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface DailyPlanContextType {
  planItems: DailyPlanItem[]
  todayPlan: DailyPlanItem[]
  addToPlan: (workItemId: string, priority: 'H1' | 'H2' | 'M' | 'L', estimatedDuration: number) => void
  removeFromPlan: (id: string) => void
  updatePlanItem: (updated: DailyPlanItem) => void
  movePlanItem: (id: string, direction: 'up' | 'down') => void
}

const DailyPlanContext = createContext<DailyPlanContextType | null>(null)

export function DailyPlanProvider({ children }: { children: ReactNode }) {
  const [planItems, setPlanItems] = useState<DailyPlanItem[]>([])

  useEffect(() => {
    setPlanItems(getDailyPlanItems())
  }, [])

  const addToPlan = (workItemId: string, priority: 'H1' | 'H2' | 'M' | 'L', estimatedDuration: number) => {
    const all = getDailyPlanItems()
    const todayItems = all.filter((i) => i.date === today()).sort((a, b) => a.orderIndex - b.orderIndex)
    const priorityOrder: Record<string, number> = { H1: 0, H2: 1, M: 2, L: 3 }
    const newP = priorityOrder[priority]
    let insertIdx = todayItems.length
    for (let i = 0; i < todayItems.length; i++) {
      if (priorityOrder[todayItems[i].priority] > newP) {
        insertIdx = i
        break
      }
    }
    const item: DailyPlanItem = {
      id: crypto.randomUUID(),
      workItemId,
      priority,
      estimatedDuration,
      date: today(),
      createdAt: Date.now(),
      orderIndex: insertIdx,
    }
    const updated = all.map((i) => {
      if (i.date !== today()) return i
      return i.orderIndex >= insertIdx
        ? { ...i, orderIndex: i.orderIndex + 1 }
        : i
    })
    updated.push(item)
    setPlanItems(persistSaveAll(updated))
  }

  const removeFromPlan = (id: string) => {
    setPlanItems(persistRemove(id))
  }

  const updatePlanItem = (updated: DailyPlanItem) => {
    setPlanItems(persistUpdate(updated))
  }

  const movePlanItem = (id: string, direction: 'up' | 'down') => {
    const all = getDailyPlanItems()
    const todayItems = all.filter((i) => i.date === today()).sort((a, b) => a.orderIndex - b.orderIndex)
    const idx = todayItems.findIndex((i) => i.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === todayItems.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const a = { ...todayItems[idx] }
    const b = { ...todayItems[swapIdx] }
    const tmp = a.orderIndex
    a.orderIndex = b.orderIndex
    b.orderIndex = tmp

    const updated = all.map((i) => {
      if (i.id === a.id) return a
      if (i.id === b.id) return b
      return i
    })
    setPlanItems(persistSaveAll(updated))
  }

  const todayPlan = planItems.filter((i) => i.date === today())

  return (
    <DailyPlanContext.Provider
      value={{
        planItems,
        todayPlan,
        addToPlan,
        removeFromPlan,
        updatePlanItem,
        movePlanItem,
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
