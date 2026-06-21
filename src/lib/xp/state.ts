import type { XpEvent, XpHistory, XpSource, XpState } from '@/lib/xp/types'

const STORAGE_KEY = 'life_os_xp'
const MIGRATED_KEY = 'life_os_xp_migrated'

const EMPTY_STATE: XpState = {
  totalXp: 0,
  awarded: {},
  daily: {},
  events: [],
}

function dateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadState(): XpState {
  if (typeof window === 'undefined') return { ...EMPTY_STATE }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...EMPTY_STATE }
  try {
    const parsed = JSON.parse(raw) as XpState
    return {
      totalXp: parsed.totalXp ?? 0,
      awarded: parsed.awarded ?? {},
      daily: parsed.daily ?? {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
    }
  } catch {
    return { ...EMPTY_STATE }
  }
}

function saveState(state: XpState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function emitXpUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xp-updated'))
  }
}

export function tryAwardXp(
  key: string,
  amount: number,
  source: XpSource,
  date: string,
  label?: string
): boolean {
  if (typeof window === 'undefined' || amount <= 0) return false

  const state = loadState()
  if (state.awarded[key] != null) return false

  const event: XpEvent = {
    id: crypto.randomUUID(),
    key,
    amount,
    source,
    date,
    timestamp: Date.now(),
    label,
  }

  state.awarded[key] = amount
  state.totalXp += amount
  state.daily[date] = (state.daily[date] ?? 0) + amount
  state.events.push(event)
  saveState(state)
  emitXpUpdated()
  return true
}

let migrationChecked = false

function runMigrationOnce(): void {
  if (typeof window === 'undefined' || migrationChecked) return
  migrationChecked = true
  if (localStorage.getItem(MIGRATED_KEY) === 'true') return

  const { backfillXpFromExistingData } = require('@/lib/xp/migration') as typeof import('@/lib/xp/migration')
  backfillXpFromExistingData()
  localStorage.setItem(MIGRATED_KEY, 'true')
}

export function getTotalXp(): number {
  runMigrationOnce()
  return loadState().totalXp
}

export function getXpState(): XpState {
  runMigrationOnce()
  return loadState()
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(12, 0, 0, 0)
  return monday
}

export function getXpHistory(referenceDate = new Date()): XpHistory {
  runMigrationOnce()
  const state = loadState()
  const todayStr = dateStr(referenceDate)
  const daily = state.daily[todayStr] ?? 0

  const monday = getMonday(referenceDate)
  let weekly = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekly += state.daily[dateStr(d)] ?? 0
  }

  const monthPrefix = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`
  let monthly = 0
  for (const [date, xp] of Object.entries(state.daily)) {
    if (date.startsWith(monthPrefix)) monthly += xp
  }

  return { daily, weekly, monthly, totalXp: state.totalXp }
}
