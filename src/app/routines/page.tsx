'use client'

import { useState } from 'react'
import type { RoutineStep, RoutineTemplate } from '@/lib/types'
import { useRoutines } from '@/lib/RoutineContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import AddRoutineToPlanModal from '@/components/routines/AddRoutineToPlanModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const DELETE_BTN = 'text-red-500 hover:text-red-600 hover:bg-red-50'

function formatEditedDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StepRow({
  step,
  index,
  nestedName,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove,
  onTextChange,
}: {
  step: RoutineStep
  index: number
  nestedName?: string
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
  onRemove: () => void
  onTextChange?: (text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(step.type === 'text' ? step.text : '')

  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 cursor-grab active:cursor-grabbing"
    >
      <span className="text-gray-300 select-none text-xs" title="Drag to reorder">
        ⠿
      </span>
      {step.type === 'text' ? (
        editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onTextChange?.(draft)
              setEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onTextChange?.(draft)
                setEditing(false)
              }
            }}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm text-gray-900 hover:text-gray-600"
          >
            {step.text}
          </button>
        )
      ) : (
        <span className="flex-1 text-sm font-medium text-violet-700 flex items-center gap-1.5">
          <span className="text-violet-400">▶</span>
          {nestedName ?? 'Nested routine'}
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </li>
  )
}

export default function RoutinesPage() {
  const {
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
    getSelectableNestedRoutines,
    getFlattenedSteps,
  } = useRoutines()

  const { getRecurringScheduleForRoutine } = useDailyPlan()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newStepText, setNewStepText] = useState<Record<string, string>>({})
  const [nestedPick, setNestedPick] = useState<Record<string, string>>({})
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [plannerRoutineId, setPlannerRoutineId] = useState<string | null>(null)

  const handleCreate = () => {
    const id = createRoutine({ name: 'New Routine' })
    setExpandedId(id)
  }

  const handleDelete = (routine: RoutineTemplate) => {
    if (!window.confirm(`Delete "${routine.name}"? This cannot be undone.`)) return
    deleteRoutine(routine.id)
    if (expandedId === routine.id) setExpandedId(null)
  }

  const saveMeta = (
    routine: RoutineTemplate,
    fields: { name?: string; description?: string; estimatedDuration?: number }
  ) => {
    const name = fields.name !== undefined ? fields.name.trim() || 'Untitled Routine' : routine.name
    const description = fields.description !== undefined ? fields.description : routine.description
    const estimatedDuration =
      fields.estimatedDuration !== undefined ? fields.estimatedDuration : routine.estimatedDuration

    if (
      name === routine.name &&
      description === routine.description &&
      estimatedDuration === routine.estimatedDuration
    ) {
      return
    }

    updateRoutine({ ...routine, name, description, estimatedDuration })
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Routines</h1>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            Reusable step-by-step checklists. Independent from Tasks — add any routine to the Planner
            as one scheduled block when you need it.
          </p>
          <p className="mt-1 text-xs text-gray-400">Routines → Today&apos;s Planner</p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          Create Routine
        </Button>
      </div>

      {routines.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-gray-400">
            No routines yet. Click Create Routine to start building your first checklist.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {routines.map((routine) => {
          const isExpanded = expandedId === routine.id
          const nestedOptions = getSelectableNestedRoutines(routine.id)
          const flatSteps = getFlattenedSteps(routine.id)
          const stepCount = flatSteps.filter((s) => s.kind === 'text').length
          const recurring = getRecurringScheduleForRoutine(routine.id)
          const displayDuration =
            recurring?.estimatedDuration ?? routine.estimatedDuration

          return (
            <Card key={routine.id} className="transition-all hover:border-gray-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{routine.name}</p>
                    {recurring && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        Daily ·{' '}
                        {recurring.placement === 'first'
                          ? 'First'
                          : recurring.placement === 'last'
                            ? 'Last'
                            : 'Manual'}
                      </span>
                    )}
                  </div>
                  {routine.description && !isExpanded && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{routine.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span>
                      {stepCount} step{stepCount !== 1 ? 's' : ''}
                    </span>
                    {displayDuration != null && <span>{displayDuration} min</span>}
                    <span>Edited {formatEditedDate(routine.updatedAt)}</span>
                  </div>
                  {!isExpanded && routine.steps.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {routine.steps.slice(0, 3).map((step) => (
                        <li key={step.id} className="text-xs text-gray-500 truncate">
                          <span className="text-gray-400 mr-1.5">•</span>
                          {step.type === 'text'
                            ? step.text
                            : `▶ ${routines.find((r) => r.id === step.routineId)?.name ?? 'Routine'}`}
                        </li>
                      ))}
                      {routine.steps.length > 3 && (
                        <li className="text-xs text-gray-400">...</li>
                      )}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : routine.id)}
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setPlannerRoutineId(routine.id)}>
                  Add to Planner
                </Button>
                <Button variant="ghost" size="sm" onClick={() => duplicateRoutine(routine.id)}>
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(routine)} className={DELETE_BTN}>
                  Delete
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400">
                        Name
                      </label>
                      <input
                        type="text"
                        defaultValue={routine.name}
                        key={`name-${routine.id}-${routine.updatedAt}`}
                        onBlur={(e) => saveMeta(routine, { name: e.target.value })}
                        className="min-h-[36px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400">
                        Default duration (min)
                      </label>
                      <input
                        type="number"
                        min={1}
                        defaultValue={routine.estimatedDuration ?? ''}
                        key={`duration-${routine.id}-${routine.updatedAt}`}
                        placeholder="e.g. 45"
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          saveMeta(routine, {
                            estimatedDuration: val ? Math.max(1, parseInt(val, 10) || 1) : undefined,
                          })
                        }}
                        className="min-h-[36px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400">
                      Description
                    </label>
                    <textarea
                      defaultValue={routine.description}
                      key={`desc-${routine.id}-${routine.updatedAt}`}
                      onBlur={(e) => saveMeta(routine, { description: e.target.value })}
                      placeholder="What is this routine for?"
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  {recurring && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                      Repeats daily ·{' '}
                      {recurring.placement === 'first'
                        ? 'First thing'
                        : recurring.placement === 'last'
                          ? 'Last thing'
                          : 'Manual placement'}{' '}
                      · {recurring.estimatedDuration} min. Use Add to Planner to change settings.
                    </p>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">
                      Steps
                    </p>
                    {routine.steps.length === 0 && (
                      <p className="text-xs text-gray-400 mb-2">
                        No steps yet. Add your first step below.
                      </p>
                    )}
                    <ul className="space-y-2">
                      {routine.steps.map((step, index) => (
                        <StepRow
                          key={step.id}
                          step={step}
                          index={index}
                          nestedName={
                            step.type === 'routine'
                              ? routines.find((r) => r.id === step.routineId)?.name
                              : undefined
                          }
                          onDragStart={(i) => setDragFrom(i)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(toIndex) => {
                            if (dragFrom !== null && dragFrom !== toIndex) {
                              reorderSteps(routine.id, dragFrom, toIndex)
                            }
                            setDragFrom(null)
                          }}
                          onRemove={() => removeStep(routine.id, step.id)}
                          onTextChange={
                            step.type === 'text'
                              ? (text) => updateTextStep(routine.id, step.id, text)
                              : undefined
                          }
                        />
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStepText[routine.id] ?? ''}
                      onChange={(e) =>
                        setNewStepText((prev) => ({ ...prev, [routine.id]: e.target.value }))
                      }
                      placeholder="New step..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTextStep(routine.id, newStepText[routine.id] ?? '')
                          setNewStepText((prev) => ({ ...prev, [routine.id]: '' }))
                        }
                      }}
                      className="min-h-[36px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        addTextStep(routine.id, newStepText[routine.id] ?? '')
                        setNewStepText((prev) => ({ ...prev, [routine.id]: '' }))
                      }}
                    >
                      Add Step
                    </Button>
                  </div>

                  {nestedOptions.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={nestedPick[routine.id] ?? ''}
                        onChange={(e) =>
                          setNestedPick((prev) => ({ ...prev, [routine.id]: e.target.value }))
                        }
                        className="min-h-[36px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="">Add nested routine...</option>
                        {nestedOptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!nestedPick[routine.id]}
                        onClick={() => {
                          const pick = nestedPick[routine.id]
                          if (!pick) return
                          addNestedRoutineStep(routine.id, pick)
                          setNestedPick((prev) => ({ ...prev, [routine.id]: '' }))
                        }}
                      >
                        Add Nested Routine
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {plannerRoutineId && (
        <AddRoutineToPlanModal
          routineId={plannerRoutineId}
          onClose={() => setPlannerRoutineId(null)}
        />
      )}
    </div>
  )
}
