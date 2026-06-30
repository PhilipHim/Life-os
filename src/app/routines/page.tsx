'use client'

import { useState } from 'react'
import type { RoutineStep, RoutineTemplate } from '@/types'
import { useRoutines } from '@/contexts/RoutineContext'
import { useDailyPlan } from '@/contexts/DailyPlanContext'
import AddRoutineToPlanModal from '@/components/features/routines/AddRoutineToPlanModal'
import Card from '@/components/ui/Card'
import Button, { deleteButtonClass } from '@/components/ui/Button'
import EmptyState from '@/components/common/EmptyState'
import PageHeader from '@/components/layout/PageHeader'
import ContextualHint from '@/components/features/first-experience/ContextualHint'
import { markHintDismissed } from '@/database/first-experience'
import MobileReorderControls from '@/components/common/MobileReorderControls'
import { useMinWidth } from '@/utils/useMediaQuery'

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
  enableDrag = true,
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
}: {
  step: RoutineStep
  index: number
  nestedName?: string
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
  onRemove: () => void
  onTextChange?: (text: string) => void
  enableDrag?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  disableUp?: boolean
  disableDown?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(step.type === 'text' ? step.text : '')

  return (
    <li
      draggable={enableDrag}
      onDragStart={() => enableDrag && onDragStart(index)}
      onDragOver={(e) => enableDrag && onDragOver(e, index)}
      onDrop={() => enableDrag && onDrop(index)}
      className={`flex items-center gap-2 rounded-lg border border-los-border-subtle bg-los-bg-card px-3 py-2 ${enableDrag ? 'md:cursor-grab md:active:cursor-grabbing' : ''}`}
    >
      {onMoveUp && onMoveDown && (
        <MobileReorderControls
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          disableUp={disableUp}
          disableDown={disableDown}
        />
      )}
      <span className="hidden text-los-text-muted/70 select-none text-xs md:inline" title="Drag to reorder" aria-hidden>
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
            className="flex-1 rounded border border-los-border los-input px-2 py-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm text-los-text-primary hover:text-los-text-secondary"
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
  const isDesktop = useMinWidth(768)

  const handleCreate = () => {
    const id = createRoutine({ name: 'New Routine' })
    setExpandedId(id)
    markHintDismissed('routines')
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
    <div className="los-page space-y-10">
      <PageHeader
        title="Routines"
        subtitle="Reusable step-by-step checklists. Independent from Tasks — add any routine to the Planner as one scheduled block when you need it."
        meta="Routines → Today's Planner"
      >
        <Button onClick={handleCreate} className="shrink-0">
          Create Routine
        </Button>
      </PageHeader>

      <ContextualHint section="routines" message="Reusable workflows for your daily habits." />

      {routines.length === 0 && (
        <EmptyState
          title="Build your first routine"
          action={{ label: 'Create your first routine', onClick: handleCreate }}
        >
          Routines turn repeatable habits into checklists you can drop into your Planner.
        </EmptyState>
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
            <Card key={routine.id} className="transition-all hover:border-los-border hover:shadow-los-card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-los-text-primary">{routine.name}</p>
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
                    <p className="text-sm text-los-text-secondary mt-1 line-clamp-2">{routine.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-los-text-muted">
                    <span>
                      {stepCount} step{stepCount !== 1 ? 's' : ''}
                    </span>
                    {displayDuration != null && <span>{displayDuration} min</span>}
                    <span>Edited {formatEditedDate(routine.updatedAt)}</span>
                  </div>
                  {!isExpanded && routine.steps.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {routine.steps.slice(0, 3).map((step) => (
                        <li key={step.id} className="text-xs text-los-text-secondary truncate">
                          <span className="text-los-text-muted mr-1.5">•</span>
                          {step.type === 'text'
                            ? step.text
                            : `▶ ${routines.find((r) => r.id === step.routineId)?.name ?? 'Routine'}`}
                        </li>
                      ))}
                      {routine.steps.length > 3 && (
                        <li className="text-xs text-los-text-muted">...</li>
                      )}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : routine.id)}
                  className="text-los-text-muted hover:text-los-text-primary shrink-0"
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
                <Button variant="ghost" size="sm" onClick={() => handleDelete(routine)} className={deleteButtonClass}>
                  Delete
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-los-border-subtle pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block los-section-label">
                        Name
                      </label>
                      <input
                        type="text"
                        defaultValue={routine.name}
                        key={`name-${routine.id}-${routine.updatedAt}`}
                        onBlur={(e) => saveMeta(routine, { name: e.target.value })}
                        className="los-input min-h-[36px] w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block los-section-label">
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
                        className="los-input min-h-[36px] w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block los-section-label">
                      Description
                    </label>
                    <textarea
                      defaultValue={routine.description}
                      key={`desc-${routine.id}-${routine.updatedAt}`}
                      onBlur={(e) => saveMeta(routine, { description: e.target.value })}
                      placeholder="What is this routine for?"
                      rows={2}
                      className="los-textarea w-full"
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
                    <p className="mb-2 los-section-label">
                      Steps
                    </p>
                    {routine.steps.length === 0 && (
                      <p className="text-xs text-los-text-muted mb-2">
                        No steps yet. Add your first step below.
                      </p>
                    )}
                    <ul className="space-y-2">
                      {routine.steps.map((step, index) => (
                        <StepRow
                          key={step.id}
                          step={step}
                          index={index}
                          enableDrag={isDesktop}
                          onMoveUp={() => {
                            if (index > 0) reorderSteps(routine.id, index, index - 1)
                          }}
                          onMoveDown={() => {
                            if (index < routine.steps.length - 1) reorderSteps(routine.id, index, index + 1)
                          }}
                          disableUp={index === 0}
                          disableDown={index === routine.steps.length - 1}
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
                      className="los-input min-h-[36px] flex-1"
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
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={nestedPick[routine.id] ?? ''}
                        onChange={(e) =>
                          setNestedPick((prev) => ({ ...prev, [routine.id]: e.target.value }))
                        }
                        className="los-select min-h-[36px] flex-1"
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
