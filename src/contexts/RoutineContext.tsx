'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { RoutineStep, RoutineTemplate } from '@/types'
import {
  getRoutineTemplates,
  addRoutineTemplate as persistAdd,
  updateRoutineTemplate as persistUpdate,
  deleteRoutineTemplate as persistDelete,
} from '@/database/routine-templates'
import { flattenRoutineSteps, wouldCreateRoutineCycle } from '@/features/routines/lib/flatten'
import { deleteRecurringRoutineScheduleForRoutine } from '@/database/recurring-routine-schedules'
import {
  checkFirstMissionCompletion,
  markFirstMissionObjective,
} from '@/lib/first-experience/mission'

interface RoutineContextType {
  routines: RoutineTemplate[]
  createRoutine: (payload: { name: string; description?: string }) => string
  updateRoutine: (updated: RoutineTemplate) => void
  deleteRoutine: (id: string) => void
  duplicateRoutine: (id: string) => string | null
  addTextStep: (routineId: string, text: string) => void
  addNestedRoutineStep: (routineId: string, nestedRoutineId: string) => void
  removeStep: (routineId: string, stepId: string) => void
  updateTextStep: (routineId: string, stepId: string, text: string) => void
  reorderSteps: (routineId: string, fromIndex: number, toIndex: number) => void
  getFlattenedSteps: (routineId: string) => ReturnType<typeof flattenRoutineSteps>
  getSelectableNestedRoutines: (routineId: string) => RoutineTemplate[]
}

const RoutineContext = createContext<RoutineContextType | null>(null)

function cloneStepsWithNewIds(steps: RoutineStep[]): RoutineStep[] {
  return steps.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
  }))
}

export function RoutineProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<RoutineTemplate[]>([])

  useEffect(() => {
    setRoutines(getRoutineTemplates())
  }, [])

  const getFlattenedSteps = useCallback(
    (routineId: string) => flattenRoutineSteps(routineId, routines),
    [routines]
  )

  const getSelectableNestedRoutines = useCallback(
    (routineId: string) =>
      routines.filter(
        (r) => r.id !== routineId && !wouldCreateRoutineCycle(routineId, r.id, routines)
      ),
    [routines]
  )

  const patchRoutine = (routineId: string, updater: (r: RoutineTemplate) => RoutineTemplate) => {
    const routine = getRoutineTemplates().find((r) => r.id === routineId)
    if (!routine) return
    setRoutines(persistUpdate(updater({ ...routine, updatedAt: Date.now() })))
  }

  const createRoutine = (payload: { name: string; description?: string }): string => {
    const now = Date.now()
    const routine: RoutineTemplate = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      description: payload.description?.trim() ?? '',
      steps: [],
      createdAt: now,
      updatedAt: now,
    }
    setRoutines(persistAdd(routine))
    markFirstMissionObjective('routine')
    checkFirstMissionCompletion()
    return routine.id
  }

  const updateRoutine = (updated: RoutineTemplate) => {
    setRoutines(persistUpdate({ ...updated, updatedAt: Date.now() }))
  }

  const deleteRoutine = (id: string) => {
    setRoutines(persistDelete(id))
    deleteRecurringRoutineScheduleForRoutine(id)
  }

  const duplicateRoutine = (id: string): string | null => {
    const source = getRoutineTemplates().find((r) => r.id === id)
    if (!source) return null
    const now = Date.now()
    const copy: RoutineTemplate = {
      id: crypto.randomUUID(),
      name: `${source.name} (copy)`,
      description: source.description,
      steps: cloneStepsWithNewIds(source.steps),
      createdAt: now,
      updatedAt: now,
    }
    setRoutines(persistAdd(copy))
    return copy.id
  }

  const addTextStep = (routineId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    patchRoutine(routineId, (r) => ({
      ...r,
      steps: [...r.steps, { id: crypto.randomUUID(), type: 'text', text: trimmed }],
    }))
  }

  const addNestedRoutineStep = (routineId: string, nestedRoutineId: string) => {
    if (wouldCreateRoutineCycle(routineId, nestedRoutineId, getRoutineTemplates())) return
    patchRoutine(routineId, (r) => ({
      ...r,
      steps: [...r.steps, { id: crypto.randomUUID(), type: 'routine', routineId: nestedRoutineId }],
    }))
  }

  const removeStep = (routineId: string, stepId: string) => {
    patchRoutine(routineId, (r) => ({
      ...r,
      steps: r.steps.filter((s) => s.id !== stepId),
    }))
  }

  const updateTextStep = (routineId: string, stepId: string, text: string) => {
    patchRoutine(routineId, (r) => ({
      ...r,
      steps: r.steps.map((s) =>
        s.id === stepId && s.type === 'text' ? { ...s, text } : s
      ),
    }))
  }

  const reorderSteps = (routineId: string, fromIndex: number, toIndex: number) => {
    patchRoutine(routineId, (r) => {
      const next = [...r.steps]
      if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length) {
        return r
      }
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...r, steps: next }
    })
  }

  return (
    <RoutineContext.Provider
      value={{
        routines,
        createRoutine,
        updateRoutine,
        deleteRoutine,
        duplicateRoutine,
        addTextStep,
        addNestedRoutineStep,
        removeStep,
        updateTextStep,
        reorderSteps,
        getFlattenedSteps,
        getSelectableNestedRoutines,
      }}
    >
      {children}
    </RoutineContext.Provider>
  )
}

export function useRoutines() {
  const context = useContext(RoutineContext)
  if (!context) {
    throw new Error('useRoutines must be used within a RoutineProvider')
  }
  return context
}
