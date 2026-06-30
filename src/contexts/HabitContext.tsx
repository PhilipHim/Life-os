'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Habit, HabitEntry } from '@/types'
import {
  getHabits, addHabit as persistAddHabit, updateHabit as persistUpdateHabit,
  deleteHabit as persistDeleteHabit,
} from '@/database/habits'
import { getEntries, getEntry, setEntry, deleteEntry } from '@/database/habit-entries'
import {
  checkFirstMissionCompletion,
  markFirstMissionObjective,
} from '@/lib/first-experience/mission'

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export interface HabitScore {
  total: number
  build: number
  avoid: number
  progress: number
}

interface HabitContextType {
  habits: Habit[]
  todayEntries: HabitEntry[]
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => void
  updateHabit: (updated: Habit) => void
  deleteHabit: (id: string) => void
  restoreHabit: (id: string) => void
  permanentDeleteHabit: (id: string) => void
  clearTrash: () => void
  getEntryForHabit: (habitId: string) => HabitEntry | undefined
  logValue: (habitId: string, value: number) => void
  toggleCheckbox: (habitId: string) => void
  toggleAvoid: (habitId: string) => void
  addTime: (habitId: string, minutes: number) => void
  isHabitSuccessful: (habitId: string) => boolean
  buildDone: number
  buildTotal: number
  avoidSuccess: number
  avoidTotal: number
  habitScore: HabitScore
}

const HabitContext = createContext<HabitContextType | null>(null)

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayEntries, setTodayEntries] = useState<HabitEntry[]>([])

  const refresh = useCallback(() => {
    setHabits(getHabits())
    setTodayEntries(getEntries().filter((e) => e.date === today()))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addHabit = (h: Omit<Habit, 'id' | 'createdAt'>) => {
    const habit: Habit = {
      ...h,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    setHabits(persistAddHabit(habit))
  }

  const updateHabit = (updated: Habit) => {
    setHabits(persistUpdateHabit(updated))
  }

  const deleteHabit = (id: string) => {
    const habit = habits.find((h) => h.id === id)
    if (!habit) return
    setHabits(persistUpdateHabit({ ...habit, status: 'deleted' }))
  }

  const restoreHabit = (id: string) => {
    const habit = habits.find((h) => h.id === id)
    if (!habit) return
    setHabits(persistUpdateHabit({ ...habit, status: 'active' }))
  }

  const permanentDeleteHabit = (id: string) => {
    setHabits(persistDeleteHabit(id))
  }

  const clearTrash = () => {
    const trashIds = habits.filter((h) => h.status === 'deleted').map((h) => h.id)
    let current = getHabits()
    for (const id of trashIds) {
      current = current.filter((h) => h.id !== id)
    }
    localStorage.setItem('productivity_habits', JSON.stringify(current))
    setHabits(getHabits())
  }

  const getEntryForHabit = (habitId: string): HabitEntry | undefined => {
    return todayEntries.find((e) => e.habitId === habitId)
  }

  const logValue = (habitId: string, value: number) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return
    const completed = habit.kind === 'avoid' ? false : value >= habit.targetValue
    setEntry(habitId, today(), value, completed)
    refresh()
  }

  const toggleCheckbox = (habitId: string) => {
    const existing = getEntry(habitId, today())
    if (existing) {
      const nextCompleted = !existing.completed
      setEntry(habitId, today(), 0, nextCompleted)
      if (nextCompleted) {
        markFirstMissionObjective('activity')
        checkFirstMissionCompletion()
      }
    } else {
      setEntry(habitId, today(), 0, true)
      markFirstMissionObjective('activity')
      checkFirstMissionCompletion()
    }
    refresh()
  }

  const toggleAvoid = (habitId: string) => {
    const existing = getEntry(habitId, today())
    if (existing) {
      deleteEntry(existing.id)
    } else {
      setEntry(habitId, today(), 0, false)
    }
    refresh()
  }

  const addTime = (habitId: string, minutes: number) => {
    const existing = getEntry(habitId, today())
    const current = existing ? existing.value : 0
    logValue(habitId, current + minutes)
  }

  const isHabitSuccessful = (habitId: string): boolean => {
    const habit = habits.find((h) => h.id === habitId)
    const entry = getEntryForHabit(habitId)
    if (!habit) return false
    if (habit.kind === 'build') {
      if (habit.type === 'checkbox') return entry?.completed ?? false
      return entry ? entry.completed : false
    }
    // avoid: no entry = success (didn't do it)
    return !entry
  }

  const activeHabits = habits.filter((h) => h.status === 'active')
  const buildHabits = activeHabits.filter((h) => h.kind === 'build')
  const avoidHabits = activeHabits.filter((h) => h.kind === 'avoid')

  const buildDone = buildHabits.filter((h) => isHabitSuccessful(h.id)).length
  const buildTotal = buildHabits.length
  const avoidSuccess = avoidHabits.filter((h) => isHabitSuccessful(h.id)).length
  const avoidTotal = avoidHabits.length

  const habitScore: HabitScore = (() => {
    const timeQuantityHabits = buildHabits.filter((h) => h.type !== 'checkbox')

    const buildScore = buildTotal > 0 ? (buildDone / buildTotal) * 40 : 0
    const avoidViolations = avoidTotal - avoidSuccess
    const avoidRate = avoidTotal > 0 ? (avoidSuccess - avoidViolations) / avoidTotal : 0
    const avoidScore = Math.max(0, avoidRate) * 40

    let totalProgress = 0
    for (const habit of timeQuantityHabits) {
      const entry = todayEntries.find((e) => e.habitId === habit.id)
      if (entry && habit.targetValue > 0) {
        totalProgress += Math.min(entry.value / habit.targetValue, 1)
      }
    }
    const avgProgress = timeQuantityHabits.length > 0 ? totalProgress / timeQuantityHabits.length : 0
    const progressScore = avgProgress * 20

    return {
      total: Math.min(Math.round(buildScore + avoidScore + progressScore), 100),
      build: Math.round(buildScore),
      avoid: Math.round(avoidScore),
      progress: Math.round(progressScore),
    }
  })()

  return (
    <HabitContext.Provider
      value={{
        habits,
        todayEntries,
        addHabit,
        updateHabit,
        deleteHabit,
        restoreHabit,
        permanentDeleteHabit,
        clearTrash,
        getEntryForHabit,
        logValue,
        toggleCheckbox,
        toggleAvoid,
        addTime,
        isHabitSuccessful,
        buildDone,
        buildTotal,
        avoidSuccess,
        avoidTotal,
        habitScore,
      }}
    >
      {children}
    </HabitContext.Provider>
  )
}

export function useHabits() {
  const context = useContext(HabitContext)
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider')
  }
  return context
}
