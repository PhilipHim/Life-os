import type { DailyPlanItem } from '@/types'

const STORAGE_KEY = 'productivity_daily_plan'

export function getDailyPlanItems(): DailyPlanItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const items = JSON.parse(raw) as DailyPlanItem[]
    return items.map((item, idx) => ({
      ...item,
      orderIndex: item.orderIndex ?? idx,
    }))
  } catch {
    return []
  }
}

function saveItems(items: DailyPlanItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function saveAllDailyPlanItems(items: DailyPlanItem[]): DailyPlanItem[] {
  saveItems(items)
  return getDailyPlanItems()
}

export function addDailyPlanItem(item: DailyPlanItem): DailyPlanItem[] {
  const items = getDailyPlanItems()
  saveItems([...items, item])
  return getDailyPlanItems()
}

export function removeDailyPlanItem(id: string): DailyPlanItem[] {
  saveItems(getDailyPlanItems().filter((i) => i.id !== id))
  return getDailyPlanItems()
}

export function updateDailyPlanItem(updated: DailyPlanItem): DailyPlanItem[] {
  const items = getDailyPlanItems()
  saveItems(items.map((i) => (i.id === updated.id ? updated : i)))
  return getDailyPlanItems()
}

export function getDailyPlanForDate(date: string): DailyPlanItem[] {
  return getDailyPlanItems().filter((i) => i.date === date)
}

export function removeDailyPlanItemsByWorkItemId(workItemId: string): DailyPlanItem[] {
  saveItems(getDailyPlanItems().filter((i) => i.workItemId !== workItemId))
  return getDailyPlanItems()
}
