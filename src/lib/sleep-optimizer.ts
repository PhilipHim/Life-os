const CYCLE_MINUTES = 90
const LATENCY_MINUTES = 15
const CYCLE_OPTIONS = [4, 5, 6] as const

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function totalSleepMinutes(cycles: number): number {
  return cycles * CYCLE_MINUTES + LATENCY_MINUTES
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export interface WakeTimeResult {
  cycles: number
  totalSleep: number
  wakeTime: string
}

export interface BedtimeResult {
  cycles: number
  totalSleep: number
  bedtime: string
}

export function calculateBedtime(wakeTime: string, cycles: number): string {
  const wakeMinutes = parseTime(wakeTime)
  const total = totalSleepMinutes(cycles)
  const bedtimeMinutes = ((wakeMinutes - total) % 1440 + 1440) % 1440
  return formatTime(bedtimeMinutes)
}

export function calculateWakeTime(bedtime: string, cycles: number): string {
  const bedMinutes = parseTime(bedtime)
  const total = totalSleepMinutes(cycles)
  const wakeMinutes = (bedMinutes + total) % 1440
  return formatTime(wakeMinutes)
}

export function calculateWakeOptions(bedtime: string): WakeTimeResult[] {
  return CYCLE_OPTIONS.map((cycles) => ({
    cycles,
    totalSleep: totalSleepMinutes(cycles),
    wakeTime: calculateWakeTime(bedtime, cycles),
  }))
}
