import type { WorkItem } from '@/lib/types'

const COMPLETIONS_KEY = 'productivity_recurring_completions'

export interface RecurringCompletion {
  templateId: string
  date: string
  completedAt: number
}

export interface RecurringInstance extends WorkItem {
  templateId: string
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getRecurringCompletions(): RecurringCompletion[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(COMPLETIONS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveCompletions(items: RecurringCompletion[]): void {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(items))
}

export function isRecurringCompletedToday(templateId: string): boolean {
  const date = today()
  return getRecurringCompletions().some((c) => c.templateId === templateId && c.date === date)
}

export function toggleRecurringCompletion(templateId: string): boolean {
  const date = today()
  const items = getRecurringCompletions()
  const idx = items.findIndex((c) => c.templateId === templateId && c.date === date)
  if (idx !== -1) {
    items.splice(idx, 1)
    saveCompletions(items)
    return false
  }
  items.push({ templateId, date, completedAt: Date.now() })
  saveCompletions(items)
  return true
}

export function getRecurringTemplates(items: WorkItem[]): WorkItem[] {
  return items.filter((i) => i.recurring === true && i.isTemplate === true && i.status !== 'deleted')
}

export function generateTodayInstances(templates: WorkItem[]): RecurringInstance[] {
  const date = today()
  const d = new Date()
  const dayOfWeek = d.getDay()
  const completions = getRecurringCompletions()

  return templates
    .filter((t) => {
      if (t.recurrenceType === 'daily') return true
      if (t.recurrenceType === 'weekly' && t.daysOfWeek && t.daysOfWeek.length > 0) {
        return t.daysOfWeek.includes(dayOfWeek)
      }
      return false
    })
    .map((t) => {
      const isDone = completions.some((c) => c.templateId === t.id && c.date === date)
      return {
        ...t,
        id: `recurring-${t.id}`,
        templateId: t.id,
        status: isDone ? 'completed' : 'active',
        completedAt: isDone ? Date.now() : null,
      } as RecurringInstance
    })
}
