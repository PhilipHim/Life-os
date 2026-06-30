import type { RoutineTemplate } from '@/types'

const STORAGE_KEY = 'life_os_routine_templates'

export function getRoutineTemplates(): RoutineTemplate[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as RoutineTemplate[]
  } catch {
    return []
  }
}

function saveAll(templates: RoutineTemplate[]): RoutineTemplate[] {
  if (typeof window === 'undefined') return templates
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  return getRoutineTemplates()
}

export function addRoutineTemplate(template: RoutineTemplate): RoutineTemplate[] {
  return saveAll([...getRoutineTemplates(), template])
}

export function updateRoutineTemplate(updated: RoutineTemplate): RoutineTemplate[] {
  return saveAll(getRoutineTemplates().map((r) => (r.id === updated.id ? updated : r)))
}

export function deleteRoutineTemplate(id: string): RoutineTemplate[] {
  return saveAll(getRoutineTemplates().filter((r) => r.id !== id))
}
