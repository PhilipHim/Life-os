'use client'

import { useState } from 'react'
import type { RoutinePlacement } from '@/lib/types'
import { useRoutines } from '@/lib/RoutineContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { localDateStr } from '@/lib/date-utils'
import Button from '@/components/ui/Button'

interface AddRoutineToPlanModalProps {
  onClose: () => void
  /** Pre-select a routine (hides the routine picker). */
  routineId?: string
}

const PLACEMENT_OPTIONS: { value: RoutinePlacement; label: string; hint: string }[] = [
  { value: 'first', label: 'First thing', hint: 'Top of today\'s plan' },
  { value: 'last', label: 'Last thing', hint: 'Bottom of today\'s plan' },
  { value: 'manual', label: 'Insert manually', hint: 'Keep current position — drag to reposition' },
]

export default function AddRoutineToPlanModal({
  onClose,
  routineId: preselectedRoutineId,
}: AddRoutineToPlanModalProps) {
  const { routines, updateRoutine } = useRoutines()
  const {
    addRoutineToPlan,
    recurringRoutineSchedules,
    planRoutineBlocks,
    upsertRecurringRoutine,
    disableRecurringRoutine,
    updateRoutineOnPlan,
  } = useDailyPlan()

  const todayStr = localDateStr()
  const preselected = preselectedRoutineId
    ? routines.find((r) => r.id === preselectedRoutineId)
    : undefined
  const blockOnToday = planRoutineBlocks.find(
    (b) => b.date === todayStr && b.routineId === preselectedRoutineId
  )
  const existingRecurring = preselectedRoutineId
    ? recurringRoutineSchedules.find((s) => s.routineId === preselectedRoutineId)
    : undefined

  const initialPlacement: RoutinePlacement =
    existingRecurring?.placement ?? blockOnToday?.placement ?? 'manual'

  const [selectedId, setSelectedId] = useState(preselectedRoutineId ?? '')
  const [duration, setDuration] = useState(
    String(
      blockOnToday?.estimatedDuration ??
        existingRecurring?.estimatedDuration ??
        preselected?.estimatedDuration ??
        45
    )
  )
  const [placement, setPlacement] = useState<RoutinePlacement>(initialPlacement)
  const [repeatDaily, setRepeatDaily] = useState(!!existingRecurring?.enabled)

  const selectedRoutine = routines.find((r) => r.id === selectedId)
  const title = preselectedRoutineId ? 'Add to Planner' : 'Add Routine'
  const isEditingSchedule = !!existingRecurring || !!blockOnToday

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return

    const durationNum = Math.max(1, parseInt(duration, 10) || 45)
    const block = planRoutineBlocks.find(
      (b) => b.date === todayStr && b.routineId === selectedId
    )
    const previousPlacement: RoutinePlacement =
      existingRecurring?.placement ?? block?.placement ?? 'manual'
    const placementChanged = placement !== previousPlacement
    const shouldReposition = placementChanged && placement !== 'manual'

    if (block) {
      updateRoutineOnPlan(
        todayStr,
        selectedId,
        { estimatedDuration: durationNum, placement },
        { reposition: shouldReposition }
      )
    } else {
      addRoutineToPlan(selectedId, durationNum, { placement })
    }

    if (repeatDaily) {
      upsertRecurringRoutine({
        routineId: selectedId,
        estimatedDuration: durationNum,
        placement,
        enabled: true,
      })
    } else if (existingRecurring?.enabled) {
      disableRecurringRoutine(selectedId)
    } else if (existingRecurring) {
      upsertRecurringRoutine({
        routineId: selectedId,
        estimatedDuration: durationNum,
        placement,
        enabled: false,
      })
    }

    if (selectedRoutine) {
      updateRoutine({
        ...selectedRoutine,
        estimatedDuration: durationNum,
      })
    }

    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {preselectedRoutineId
            ? `Schedule "${preselected?.name ?? 'Routine'}" in today's plan.`
            : 'Add a routine block to today\'s plan.'}
          {isEditingSchedule &&
            " Changing placement updates today's plan immediately. Repeat settings affect future days."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {!preselectedRoutineId && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400">
                Routine
              </label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value)
                  const routine = routines.find((r) => r.id === e.target.value)
                  const block = planRoutineBlocks.find(
                    (b) => b.date === todayStr && b.routineId === e.target.value
                  )
                  const recurring = recurringRoutineSchedules.find(
                    (s) => s.routineId === e.target.value
                  )
                  if (recurring) {
                    setPlacement(recurring.placement ?? 'manual')
                    setRepeatDaily(recurring.enabled)
                    setDuration(String(recurring.estimatedDuration))
                  } else if (block) {
                    setPlacement(block.placement ?? 'manual')
                    setDuration(String(block.estimatedDuration))
                    setRepeatDaily(false)
                  } else if (routine?.estimatedDuration) {
                    setDuration(String(routine.estimatedDuration))
                    setPlacement('manual')
                    setRepeatDaily(false)
                  }
                }}
                className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select a routine...</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400">
              Estimated duration (min)
            </label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-400">
              Placement
            </legend>
            <div className="space-y-2">
              {PLACEMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-2.5 cursor-pointer rounded-lg border px-3 py-2.5 transition-colors ${
                    placement === option.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="placement"
                    value={option.value}
                    checked={placement === option.value}
                    onChange={() => setPlacement(option.value)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
            <input
              type="checkbox"
              checked={repeatDaily}
              onChange={(e) => setRepeatDaily(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">Repeat every day</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Auto-add to each new planner day at the chosen placement. You can still move it
                after insertion.
              </span>
            </span>
          </label>

          {routines.length === 0 && !preselectedRoutineId && (
            <p className="text-xs text-gray-400">Create routines on the Routines page first.</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!preselectedRoutineId && routines.length === 0}>
              {isEditingSchedule ? 'Save' : 'Add To Plan'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
