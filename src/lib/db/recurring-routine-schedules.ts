import type { RecurringRoutineSchedule } from '@/lib/types'

const STORAGE_KEY = 'life_os_recurring_routine_schedules'

export function getRecurringRoutineSchedules(): RecurringRoutineSchedule[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as RecurringRoutineSchedule[]
  } catch {
    return []
  }
}

function saveAll(schedules: RecurringRoutineSchedule[]): RecurringRoutineSchedule[] {
  if (typeof window === 'undefined') return schedules
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  return getRecurringRoutineSchedules()
}

export function upsertRecurringRoutineSchedule(
  schedule: RecurringRoutineSchedule
): RecurringRoutineSchedule[] {
  const all = getRecurringRoutineSchedules()
  const idx = all.findIndex((s) => s.routineId === schedule.routineId)
  if (idx === -1) return saveAll([...all, schedule])
  const next = [...all]
  next[idx] = schedule
  return saveAll(next)
}

export function deleteRecurringRoutineScheduleForRoutine(routineId: string): RecurringRoutineSchedule[] {
  return saveAll(getRecurringRoutineSchedules().filter((s) => s.routineId !== routineId))
}

export function getRecurringScheduleForRoutine(
  routineId: string
): RecurringRoutineSchedule | undefined {
  return getRecurringRoutineSchedules().find((s) => s.routineId === routineId)
}
