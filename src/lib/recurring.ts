import type { WorkItem } from '@/lib/types'

const COMPLETIONS_KEY = 'productivity_recurring_completions'
const SKIPS_KEY = 'productivity_recurring_skips'

export interface RecurringCompletion {
  templateId: string
  date: string
  completedAt: number
}

export interface RecurringSkip {
  templateId: string
  date: string
  skippedAt: number
}

export interface RecurringInstance extends WorkItem {
  templateId: string
  instanceStatus: 'active' | 'completed' | 'skipped'
}

export interface RecurringTemplateStats {
  templateId: string
  streak: number
  weeklyCompletionPct: number
  weeklyCompleted: number
  weeklyDue: number
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateStrFromDate(d: Date): string {
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

export function getRecurringSkips(): RecurringSkip[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(SKIPS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveSkips(items: RecurringSkip[]): void {
  localStorage.setItem(SKIPS_KEY, JSON.stringify(items))
}

export function isRecurringCompletedToday(templateId: string, date?: string): boolean {
  const d = date ?? today()
  return getRecurringCompletions().some((c) => c.templateId === templateId && c.date === d)
}

export function isRecurringSkippedToday(templateId: string, date?: string): boolean {
  const d = date ?? today()
  return getRecurringSkips().some((s) => s.templateId === templateId && s.date === d)
}

export function isTemplateDueOnDate(template: WorkItem, date: string): boolean {
  if (!template.recurring || !template.isTemplate) return false
  if (template.recurrenceType === 'daily') return true
  if (template.recurrenceType === 'weekly' && template.daysOfWeek && template.daysOfWeek.length > 0) {
    const dayOfWeek = new Date(date + 'T12:00:00').getDay()
    return template.daysOfWeek.includes(dayOfWeek)
  }
  return false
}

export function toggleRecurringCompletion(templateId: string): boolean {
  const date = today()
  const completions = getRecurringCompletions()
  const skips = getRecurringSkips()
  const idx = completions.findIndex((c) => c.templateId === templateId && c.date === date)
  if (idx !== -1) {
    completions.splice(idx, 1)
    saveCompletions(completions)
    return false
  }
  const skipIdx = skips.findIndex((s) => s.templateId === templateId && s.date === date)
  if (skipIdx !== -1) {
    skips.splice(skipIdx, 1)
    saveSkips(skips)
  }
  completions.push({ templateId, date, completedAt: Date.now() })
  saveCompletions(completions)
  return true
}

export function skipRecurringToday(templateId: string): void {
  const date = today()
  const completions = getRecurringCompletions().filter(
    (c) => !(c.templateId === templateId && c.date === date)
  )
  saveCompletions(completions)

  const skips = getRecurringSkips()
  if (!skips.some((s) => s.templateId === templateId && s.date === date)) {
    skips.push({ templateId, date, skippedAt: Date.now() })
    saveSkips(skips)
  }
}

export function unskipRecurringToday(templateId: string): void {
  const date = today()
  saveSkips(getRecurringSkips().filter((s) => !(s.templateId === templateId && s.date === date)))
}

export function getRecurringTemplates(items: WorkItem[]): WorkItem[] {
  return items.filter((i) => i.recurring === true && i.isTemplate === true && i.status !== 'deleted')
}

function resolveInstanceStatus(
  templateId: string,
  date: string,
  completions: RecurringCompletion[],
  skips: RecurringSkip[]
): RecurringInstance['instanceStatus'] {
  if (completions.some((c) => c.templateId === templateId && c.date === date)) return 'completed'
  if (skips.some((s) => s.templateId === templateId && s.date === date)) return 'skipped'
  return 'active'
}

export function generateTodayInstances(templates: WorkItem[]): RecurringInstance[] {
  const date = today()
  const completions = getRecurringCompletions()
  const skips = getRecurringSkips()

  return templates
    .filter((t) => isTemplateDueOnDate(t, date))
    .map((t) => {
      const instanceStatus = resolveInstanceStatus(t.id, date, completions, skips)
      return {
        ...t,
        id: `recurring-${t.id}`,
        templateId: t.id,
        status: instanceStatus === 'completed' ? 'completed' : 'active',
        instanceStatus,
        completedAt: instanceStatus === 'completed' ? Date.now() : null,
      } as RecurringInstance
    })
}

export function generateInstancesForDate(templates: WorkItem[], date: string): RecurringInstance[] {
  const completions = getRecurringCompletions()
  const skips = getRecurringSkips()

  return templates
    .filter((t) => isTemplateDueOnDate(t, date))
    .map((t) => {
      const instanceStatus = resolveInstanceStatus(t.id, date, completions, skips)
      return {
        ...t,
        id: `recurring-${t.id}-${date}`,
        templateId: t.id,
        status: instanceStatus === 'completed' ? 'completed' : 'active',
        instanceStatus,
        completedAt: instanceStatus === 'completed' ? Date.now() : null,
      } as RecurringInstance
    })
}

export function computeRecurringStreak(template: WorkItem): number {
  const completions = getRecurringCompletions().filter((c) => c.templateId === template.id)
  const completionDates = new Set(completions.map((c) => c.date))
  const todayStr = today()

  let streak = 0
  const d = new Date()
  d.setHours(12, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const ds = dateStrFromDate(d)
    if (!isTemplateDueOnDate(template, ds)) {
      d.setDate(d.getDate() - 1)
      continue
    }
    if (completionDates.has(ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else if (ds === todayStr) {
      break
    } else {
      break
    }
  }

  return streak
}

export function computeRecurringWeeklyCompletion(template: WorkItem): {
  pct: number
  completed: number
  due: number
} {
  const completions = getRecurringCompletions().filter((c) => c.templateId === template.id)
  const completionDates = new Set(completions.map((c) => c.date))
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(12, 0, 0, 0)

  let due = 0
  let completed = 0

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const ds = dateStrFromDate(d)
    if (isTemplateDueOnDate(template, ds)) {
      due++
      if (completionDates.has(ds)) completed++
    }
  }

  const pct = due > 0 ? Math.round((completed / due) * 100) : 0
  return { pct, completed, due }
}

export function computeRecurringTemplateStats(template: WorkItem): RecurringTemplateStats {
  const weekly = computeRecurringWeeklyCompletion(template)
  return {
    templateId: template.id,
    streak: computeRecurringStreak(template),
    weeklyCompletionPct: weekly.pct,
    weeklyCompleted: weekly.completed,
    weeklyDue: weekly.due,
  }
}

export function computeTodayRecurringPlannerStats(
  templates: WorkItem[],
  excludeTemplateIds: Set<string> = new Set()
): { total: number; completed: number } {
  const instances = generateTodayInstances(templates).filter(
    (i) => !excludeTemplateIds.has(i.templateId)
  )
  const countable = instances.filter((i) => i.instanceStatus !== 'skipped')
  const completed = countable.filter((i) => i.instanceStatus === 'completed')
  return { total: countable.length, completed: completed.length }
}

export function clearRecurringDataForTemplate(templateId: string): void {
  saveCompletions(getRecurringCompletions().filter((c) => c.templateId !== templateId))
  saveSkips(getRecurringSkips().filter((s) => s.templateId !== templateId))
}

export function isRecurringWorkItemCompleted(workItemId: string, workItems: WorkItem[]): boolean {
  const wi = workItems.find((w) => w.id === workItemId)
  if (wi?.recurring && wi.isTemplate) {
    return isRecurringCompletedToday(workItemId)
  }
  return wi?.status === 'completed'
}
