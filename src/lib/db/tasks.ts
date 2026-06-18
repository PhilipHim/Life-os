import type { Task } from '@/lib/types'

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
      recurring: (t as any).recurring || 'none',
      completedAt: (t as any).completedAt ?? null,
      createdAt: t.createdAt || Date.now(),
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
  saveTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
  return getTasks()
}

export function deleteTask(id: string): Task[] {
  saveTasks(getTasks().filter((t) => t.id !== id))
  return getTasks()
}
