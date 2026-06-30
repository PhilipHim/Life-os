import type { Task } from '@/lib/types'
import { awardLegacyTaskCompleted } from '@/lib/xp/award'

const STORAGE_KEY = 'productivity_tasks'

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const tasks = JSON.parse(raw) as Task[]
    return tasks.map((t) => ({
      id: t.id,
      title: t.title || '',
      description: t.description || '',
      notes: t.notes || '',
      completed: t.completed ?? (t as any).done ?? false,
      deleted: (t as any).deleted ?? false,
      recurring: (t as any).recurring || 'none',
      completedAt: (t as any).completedAt ?? null,
      createdAt: t.createdAt || Date.now(),
      priority: (t as any).priority ?? 'M',
      estimatedDuration: (t as any).estimatedDuration ?? 30,
    }))
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function addTask(task: Task): Task[] {
  const tasks = getTasks()
  saveTasks([...tasks, task])
  return getTasks()
}

export function updateTask(updated: Task): Task[] {
  const tasks = getTasks()
  const prev = tasks.find((t) => t.id === updated.id)
  saveTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
  if (prev && !prev.completed && updated.completed) {
    awardLegacyTaskCompleted(updated.id, updated.title, updated.completedAt ?? Date.now())
  }
  return getTasks()
}

export function deleteTask(id: string): Task[] {
  saveTasks(getTasks().filter((t) => t.id !== id))
  return getTasks()
}

export function softDeleteTask(id: string): Task[] {
  const tasks = getTasks()
  saveTasks(tasks.map((t) => (t.id === id ? { ...t, deleted: true } : t)))
  return getTasks()
}

export function restoreTask(id: string): Task[] {
  const tasks = getTasks()
  saveTasks(tasks.map((t) => (t.id === id ? { ...t, deleted: false } : t)))
  return getTasks()
}

export function deleteAllCompletedTasks(): Task[] {
  saveTasks(getTasks().filter((t) => !(t.recurring === 'none' && t.completed && !t.deleted)))
  return getTasks()
}

export function emptyTrashTasks(): Task[] {
  saveTasks(getTasks().filter((t) => !t.deleted))
  return getTasks()
}
