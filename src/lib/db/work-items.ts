import type { WorkItem } from '@/lib/types'
import { awardWorkItemCompleted } from '@/lib/xp/award'

const STORAGE_KEY = 'productivity_work_items'
const MIGRATED_KEY = 'productivity_work_items_migrated'

function migrateFromLegacy(): WorkItem[] {
  if (typeof window === 'undefined') return []
  const already = localStorage.getItem(MIGRATED_KEY)
  if (already === 'true') return []

  const rawTasks = localStorage.getItem('productivity_tasks')
  const rawProjects = localStorage.getItem('productivity_projects')

  const items: WorkItem[] = []
  const now = Date.now()

  if (rawTasks) {
    try {
      const tasks = JSON.parse(rawTasks)
      for (const t of tasks) {
        const old = t as any
        const done = old.done ?? false
        const completed = old.completed ?? done
        items.push({
          id: t.id,
          type: 'single',
          title: t.title || '',
          description: t.description || '',
          notes: t.notes || '',
          status: old.status || (completed ? 'completed' : 'active'),
          createdAt: t.createdAt || now,
          updatedAt: now,
          childrenIds: [],
          completedAt: old.completedAt ?? null,
        })
      }
    } catch { /* skip */ }
  }

  if (rawProjects) {
    try {
      const projects = JSON.parse(rawProjects)
      for (const p of projects) {
        const old = p as any
        items.push({
          id: p.id,
          type: 'group',
          title: p.title || '',
          description: p.description || '',
          notes: p.notes || '',
          status: old.status || (old.completed ? 'completed' : 'active'),
          createdAt: p.createdAt || now,
          updatedAt: now,
          childrenIds: Array.isArray(old.taskIds) ? old.taskIds.filter((id: string) => items.some((i) => i.id === id)) : [],
          completedAt: null,
        })
      }
    } catch { /* skip */ }
  }

  if (items.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }
  localStorage.setItem(MIGRATED_KEY, 'true')
  return items
}

export function getWorkItems(): WorkItem[] {
  if (typeof window === 'undefined') return []
  migrateFromLegacy()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as WorkItem[]
  } catch {
    return []
  }
}

function saveWorkItems(items: WorkItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addWorkItem(item: WorkItem): WorkItem[] {
  const items = getWorkItems()
  saveWorkItems([...items, item])
  return getWorkItems()
}

export function updateWorkItem(updated: WorkItem): WorkItem[] {
  const items = getWorkItems()
  const prev = items.find((i) => i.id === updated.id)
  saveWorkItems(items.map((i) => (i.id === updated.id ? updated : i)))
  if (
    prev &&
    prev.status !== 'completed' &&
    updated.status === 'completed' &&
    updated.type === 'single'
  ) {
    awardWorkItemCompleted(updated.id, updated.title, updated.completedAt ?? updated.updatedAt)
  }
  return getWorkItems()
}

export function deleteWorkItem(id: string): WorkItem[] {
  saveWorkItems(getWorkItems().filter((i) => i.id !== id))
  return getWorkItems()
}

export function getWorkItemById(id: string): WorkItem | undefined {
  return getWorkItems().find((i) => i.id === id)
}

export function updateWorkItems(items: WorkItem[]): WorkItem[] {
  const all = getWorkItems()
  for (const item of items) {
    const prev = all.find((i) => i.id === item.id)
    const idx = all.findIndex((i) => i.id === item.id)
    if (idx !== -1) all[idx] = item
    if (
      prev &&
      prev.status !== 'completed' &&
      item.status === 'completed' &&
      item.type === 'single'
    ) {
      awardWorkItemCompleted(item.id, item.title, item.completedAt ?? item.updatedAt)
    }
  }
  saveWorkItems(all)
  return getWorkItems()
}

export function addWorkItems(items: WorkItem[]): WorkItem[] {
  const existing = getWorkItems()
  saveWorkItems([...existing, ...items])
  return getWorkItems()
}

export function replaceWorkItems(items: WorkItem[]): WorkItem[] {
  saveWorkItems(items)
  return getWorkItems()
}
