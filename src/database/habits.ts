import type { Habit } from '@/types'

const STORAGE_KEY = 'productivity_habits'

export function getHabits(): Habit[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const habits = JSON.parse(raw) as Habit[]
    return habits.map((h) => {
      const old = h as any
      return {
        id: h.id,
        title: h.title || '',
        description: h.description || '',
        kind: old.kind || 'build',
        type: old.type || 'checkbox',
        targetValue: h.targetValue || 0,
        createdAt: h.createdAt || Date.now(),
        status: old.status || (old.active === false ? 'deleted' : 'active'),
      }
    })
  } catch {
    return []
  }
}

function saveHabits(habits: Habit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
}

export function addHabit(habit: Habit): Habit[] {
  const habits = getHabits()
  saveHabits([...habits, habit])
  return getHabits()
}

export function updateHabit(updated: Habit): Habit[] {
  const habits = getHabits()
  saveHabits(habits.map((h) => (h.id === updated.id ? updated : h)))
  return getHabits()
}

export function deleteHabit(id: string): Habit[] {
  saveHabits(getHabits().filter((h) => h.id !== id))
  return getHabits()
}
