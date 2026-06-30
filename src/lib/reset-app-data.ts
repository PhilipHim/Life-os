const PRESERVED_KEYS = new Set(['ascend_settings'])

const APP_DATA_PREFIXES = ['life_os_', 'productivity_', 'focus_sessions', 'ascend_first']

export const RESET_DATA_ITEMS = [
  'Tasks & work items',
  'Planner & daily plans',
  'Routines & schedules',
  'Journal entries',
  'Habits & habit logs',
  'Health & sleep data',
  'Finance tracking',
  'Analytics history',
  'XP & character progression',
  'Achievements & titles',
  'Challenges & quotes',
] as const

export function resetAllAppData(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || PRESERVED_KEYS.has(key)) continue
    if (APP_DATA_PREFIXES.some((prefix) => key.startsWith(prefix) || key === prefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
