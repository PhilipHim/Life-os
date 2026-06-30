'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { DailyPlanItem, WorkItem } from '@/types'
import { useDailyPlan } from '@/contexts/DailyPlanContext'
import { useFocus } from '@/contexts/FocusContext'
import { useWorkItems } from '@/contexts/WorkItemContext'
import {
  buildExecutionQueue,
  summarizeExecution,
  formatMinutes,
  type ExecutionBlock,
} from '@/features/planner/lib/planner'
import {
  getPlannerBreakState,
  addManualBreak,
  removeBreak,
  resetPlannerBreaks,
} from '@/database/planner-breaks'
import { getPlannerDefaults, setPlannerDefaults } from '@/features/planner/lib/planner-defaults'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import EditPlanItemModal from '@/components/common/EditPlanItemModal'
import AddRoutineToPlanModal from '@/components/features/routines/AddRoutineToPlanModal'
import PlanRoutineCard from '@/components/features/routines/PlanRoutineCard'
import { buildPlanTimeline } from '@/features/routines/lib/plan-timeline'
import type { TimelineOrderEntry } from '@/features/routines/lib/plan-ordering'
import { formatDisplayDate, localDateStr } from '@/utils/date'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import ContextualHint from '@/components/features/first-experience/ContextualHint'
import { markPlannerVisited } from '@/lib/first-experience/mission'
import WarningBanner from '@/components/common/WarningBanner'
import MobileReorderControls from '@/components/common/MobileReorderControls'
import { useMinWidth } from '@/utils/useMediaQuery'

const priorityColor: Record<string, string> = {
  H1: 'bg-red-500',
  H2: 'bg-orange-400',
  M: 'bg-blue-500',
  L: 'bg-gray-400',
}

const priorities = ['H1', 'H2', 'M', 'L'] as const

function formatFocusTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${s}s`
}

function isTaskBlock(block: ExecutionBlock): block is Extract<ExecutionBlock, { kind: 'task' }> {
  return block.kind === 'task'
}

export default function PlanPage() {
  const { todayPlan, addToPlan, removeFromPlan, updatePlanItem, autoPlanToday, todayRoutineBlocks, reorderPlanTimeline } =
    useDailyPlan()
  const { activeWorkItemId, startFocus, stopFocus, focusSessions } = useFocus()
  const { workItems, toggleWorkItem } = useWorkItems()

  const todayStr = localDateStr()
  const [editItem, setEditItem] = useState<DailyPlanItem | null>(null)
  const [breakState, setBreakState] = useState(() => getPlannerBreakState(todayStr))
  const [dragEntry, setDragEntry] = useState<TimelineOrderEntry | null>(null)
  const [defaultsVersion, setDefaultsVersion] = useState(0)
  const [autoPlanFeedback, setAutoPlanFeedback] = useState<string | null>(null)
  const [showAddRoutine, setShowAddRoutine] = useState(false)
  const isDesktop = useMinWidth(768)

  useEffect(() => {
    markPlannerVisited()
  }, [])

  const plannedWorkItemIds = useMemo(
    () => new Set(todayPlan.map((p) => p.workItemId)),
    [todayPlan]
  )

  const availableTasks = useMemo(() => {
    return workItems.filter(
      (i) =>
        i.type === 'single' &&
        i.status === 'active' &&
        !i.isTemplate &&
        !i.parentId &&
        !plannedWorkItemIds.has(i.id)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItems, plannedWorkItemIds, defaultsVersion])

  const planableTasks = useMemo(() => {
    return workItems.filter(
      (i) => i.type === 'single' && i.status === 'active' && !i.isTemplate && !i.parentId
    )
  }, [workItems])

  const canAutoPlan = planableTasks.length > 0

  const getTitle = useCallback(
    (workItemId: string) => workItems.find((w) => w.id === workItemId)?.title ?? 'Unknown task',
    [workItems]
  )

  const executionQueue = useMemo(
    () =>
      buildExecutionQueue(todayPlan, getTitle, {
        hiddenAutoBreaks: breakState.hiddenAutoBreaks,
        manualBreaks: breakState.manualBreaks,
      }),
    [todayPlan, getTitle, breakState]
  )

  const planTimeline = useMemo(
    () => buildPlanTimeline(executionQueue, todayRoutineBlocks),
    [executionQueue, todayRoutineBlocks]
  )

  const summary = useMemo(
    () => summarizeExecution(todayPlan, executionQueue),
    [todayPlan, executionQueue]
  )

  const planCompleted = todayPlan.filter((pi) => {
    const wi = workItems.find((w) => w.id === pi.workItemId)
    return wi?.status === 'completed'
  }).length

  const completionPct =
    summary.totalTasks > 0 ? Math.round((planCompleted / summary.totalTasks) * 100) : 0

  const handleAddToPlan = (task: WorkItem) => {
    const defaults = getPlannerDefaults(task.id)
    addToPlan(task.id, defaults.priority, defaults.estimatedDuration)
  }

  const handleDefaultsChange = (
    workItemId: string,
    patch: Partial<{ priority: 'H1' | 'H2' | 'M' | 'L'; estimatedDuration: number }>
  ) => {
    const current = getPlannerDefaults(workItemId)
    setPlannerDefaults(workItemId, { ...current, ...patch })
    setDefaultsVersion((v) => v + 1)
  }

  const timelineOrderEntries = useMemo((): TimelineOrderEntry[] => {
    const entries: TimelineOrderEntry[] = []
    for (const entry of planTimeline) {
      if (entry.kind === 'routine') {
        entries.push({ kind: 'routine', id: entry.block.id })
      } else if (entry.block.kind === 'task') {
        entries.push({ kind: 'task', id: entry.block.planItem.id })
      }
    }
    return entries
  }, [planTimeline])

  const handleTimelineDragStart = (entry: TimelineOrderEntry) => {
    setDragEntry(entry)
  }

  const handleTimelineDrop = (target: TimelineOrderEntry) => {
    if (
      !dragEntry ||
      (dragEntry.kind === target.kind && dragEntry.id === target.id)
    ) {
      return
    }

    const entries = [...timelineOrderEntries]
    const fromIdx = entries.findIndex(
      (e) => e.kind === dragEntry.kind && e.id === dragEntry.id
    )
    const toIdx = entries.findIndex(
      (e) => e.kind === target.kind && e.id === target.id
    )
    if (fromIdx === -1 || toIdx === -1) return

    const next = [...entries]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    reorderPlanTimeline(next)
    setDragEntry(null)
  }

  const isDraggingEntry = (entry: TimelineOrderEntry) =>
    !!dragEntry && dragEntry.kind === entry.kind && dragEntry.id === entry.id

  const moveTimelineEntry = (entry: TimelineOrderEntry, direction: 'up' | 'down') => {
    const idx = timelineOrderEntries.findIndex(
      (e) => e.kind === entry.kind && e.id === entry.id
    )
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= timelineOrderEntries.length) return
    const next = [...timelineOrderEntries]
    const [moved] = next.splice(idx, 1)
    next.splice(targetIdx, 0, moved)
    reorderPlanTimeline(next)
  }

  const getTimelineIndex = (entry: TimelineOrderEntry) =>
    timelineOrderEntries.findIndex((e) => e.kind === entry.kind && e.id === entry.id)

  const handleFocus = (pi: DailyPlanItem) => {
    if (activeWorkItemId === pi.workItemId) {
      stopFocus()
    } else {
      startFocus(pi.workItemId, getTitle(pi.workItemId))
    }
  }

  const handleSave = (updated: DailyPlanItem) => {
    updatePlanItem(updated)
    setEditItem(null)
  }

  const handleAddBreakAfter = (afterPlanItemId: string | null) => {
    setBreakState(addManualBreak(todayStr, afterPlanItemId))
  }

  const handleRemoveBreak = (breakId: string, auto: boolean) => {
    setBreakState(removeBreak(todayStr, breakId, auto))
  }

  const handleAutoPlan = () => {
    setAutoPlanFeedback(null)
    const result = autoPlanToday(planableTasks.map((t) => t.id))
    if (result === 'no_eligible') {
      setAutoPlanFeedback('No eligible tasks found.')
      return
    }
    setBreakState(resetPlannerBreaks(todayStr))
  }

  return (
    <div className="los-page space-y-10">
      <PageHeader
        title="Execution Plan"
        subtitle="Build today's queue — prioritize, reorder, and execute."
        meta={formatDisplayDate(todayStr)}
      >
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button variant="secondary" onClick={() => setShowAddRoutine(true)}>
            Add Routine
          </Button>
          <Button variant="secondary" disabled={!canAutoPlan} onClick={handleAutoPlan}>
            Auto Plan
          </Button>
        </div>
        {!canAutoPlan ? (
          <p className="text-xs text-los-text-muted sm:text-right">No tasks available for planning.</p>
        ) : (
          <p className="text-xs text-los-text-muted sm:text-right">
            Pulls {planableTasks.length} task{planableTasks.length !== 1 ? 's' : ''} from Work, sorts by priority, and builds today&apos;s queue.
          </p>
        )}
      </PageHeader>

      {autoPlanFeedback && <WarningBanner>{autoPlanFeedback}</WarningBanner>}

      <ContextualHint section="planner" message="This is where you organize your day." />

      {summary.totalTasks > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="los-section-label">Planned Tasks</p>
            <p className="mt-1 text-2xl font-bold text-los-text-primary tabular-nums">{summary.totalTasks}</p>
          </Card>
          <Card className="p-4">
            <p className="los-section-label">Work Time</p>
            <p className="mt-1 text-2xl font-bold text-los-text-primary tabular-nums">
              {formatMinutes(summary.totalWorkMinutes)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="los-section-label">Breaks</p>
            <p className="mt-1 text-2xl font-bold text-los-text-primary tabular-nums">
              {summary.breakCount}
              <span className="text-sm font-normal text-los-text-muted ml-1">
                ({formatMinutes(summary.totalBreakMinutes)})
              </span>
            </p>
          </Card>
          <Card className="p-4">
            <p className="los-section-label">Completion</p>
            <p className="mt-1 text-2xl font-bold text-los-text-primary tabular-nums">
              {planCompleted}/{summary.totalTasks}
              <span className="text-sm font-normal text-los-text-muted ml-1">({completionPct}%)</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-los-bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full los-progress-gold transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </Card>
        </div>
      )}

      <section className="space-y-3" id="available-tasks">
        <h2 className="los-section-label">Available Tasks</h2>
        {availableTasks.length === 0 ? (
          <EmptyState
            title={planableTasks.length === 0 ? 'Ready when you are' : 'All set for today'}
            action={
              planableTasks.length === 0
                ? { label: 'Create a task first', href: '/work' }
                : undefined
            }
          >
            {planableTasks.length === 0
              ? 'Create tasks in Work, then add them here to build your execution queue.'
              : "All active tasks are already in today's plan. Nice work."}
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {availableTasks.map((task) => {
              const defaults = getPlannerDefaults(task.id)
              return (
                <Card key={task.id} className="p-4 transition-all hover:border-los-border">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-los-text-primary">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-los-text-muted mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1">
                        {priorities.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleDefaultsChange(task.id, { priority: p })}
                            className={`min-h-[36px] min-w-[36px] rounded px-2.5 py-1.5 text-[10px] font-bold transition-all sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1 ${
                              defaults.priority === p
                                ? `${priorityColor[p]} text-white`
                                : 'bg-los-bg-secondary text-los-text-secondary hover:bg-los-bg-card'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={defaults.estimatedDuration}
                        onChange={(e) =>
                          handleDefaultsChange(task.id, {
                            estimatedDuration: Math.max(1, parseInt(e.target.value, 10) || 30),
                          })
                        }
                        className="los-input w-16 px-2 py-1 text-xs tabular-nums"
                        aria-label="Estimated minutes"
                      />
                      <span className="text-xs text-los-text-muted">min</span>
                      <Button size="sm" onClick={() => handleAddToPlan(task)}>
                        Add To Plan
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="los-section-label">Today&apos;s Plan</h2>
          {todayPlan.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => handleAddBreakAfter(null)}>
              + Add Break
            </Button>
          )}
        </div>

        {todayPlan.length === 0 && todayRoutineBlocks.length === 0 ? (
          <EmptyState
            title="Your day starts here"
            action={{ label: 'Add from available tasks', href: '#available-tasks' }}
          >
            Your execution queue is empty. Add tasks above or drop in a routine to build momentum.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {planTimeline.map((entry) => {
              if (entry.kind === 'routine') {
                const routineEntry: TimelineOrderEntry = {
                  kind: 'routine',
                  id: entry.block.id,
                }
                const routineIdx = getTimelineIndex(routineEntry)
                return (
                  <div
                    key={entry.block.id}
                    draggable={isDesktop}
                    onDragStart={() => isDesktop && handleTimelineDragStart(routineEntry)}
                    onDragEnd={() => setDragEntry(null)}
                    onDragOver={(e) => isDesktop && e.preventDefault()}
                    onDrop={(e) => {
                      if (!isDesktop) return
                      e.preventDefault()
                      handleTimelineDrop(routineEntry)
                    }}
                    className={isDraggingEntry(routineEntry) ? 'opacity-50' : ''}
                  >
                    <div className="flex gap-2">
                      <MobileReorderControls
                        onMoveUp={() => moveTimelineEntry(routineEntry, 'up')}
                        onMoveDown={() => moveTimelineEntry(routineEntry, 'down')}
                        disableUp={routineIdx <= 0}
                        disableDown={routineIdx === timelineOrderEntries.length - 1}
                      />
                      <div className="min-w-0 flex-1">
                        <PlanRoutineCard block={entry.block} draggable={isDesktop} />
                      </div>
                    </div>
                  </div>
                )
              }

              const block = entry.block
              if (block.kind === 'break') {
                return (
                  <Card
                    key={block.id}
                    className="border-dashed border-los-border bg-los-bg-secondary/80 py-3 px-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg text-los-text-muted/70">☕</span>
                        <div>
                          <p className="text-sm font-medium text-los-text-secondary">Break</p>
                          <p className="text-xs text-los-text-muted">
                            {block.durationMinutes} minutes
                            {block.auto && (
                              <span className="ml-2 rounded bg-los-bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-los-text-secondary">
                                Auto
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBreak(block.id, block.auto)}
                        className="text-los-text-muted hover:text-red-500 shrink-0"
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                )
              }

              const pi = block.planItem
              const wi = workItems.find((w) => w.id === pi.workItemId)
              const done = wi?.status === 'completed'
              const isActive = activeWorkItemId === pi.workItemId
              const focusMs = focusSessions
                .filter((s) => s.workItemId === pi.workItemId && s.duration > 0)
                .reduce((sum, s) => sum + s.duration, 0)
              const taskEntry: TimelineOrderEntry = { kind: 'task', id: pi.id }
              const taskIdx = getTimelineIndex(taskEntry)
              const isDragging = isDraggingEntry(taskEntry)

              return (
                <div
                  key={pi.id}
                  draggable={isDesktop}
                  onDragStart={() => isDesktop && handleTimelineDragStart(taskEntry)}
                  onDragEnd={() => setDragEntry(null)}
                  onDragOver={(e) => isDesktop && e.preventDefault()}
                  onDrop={(e) => {
                    if (!isDesktop) return
                    e.preventDefault()
                    handleTimelineDrop(taskEntry)
                  }}
                  className={isDragging ? 'opacity-50' : ''}
                >
                  <Card
                    className={`transition-all hover:border-los-border hover:shadow-los-card-hover ${
                      isDesktop ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${isActive ? 'ring-2 ring-los-gold bg-los-bg-secondary' : ''} ${done ? 'opacity-75' : ''}`}
                  >
                    <div className="flex gap-2">
                      <MobileReorderControls
                        onMoveUp={() => moveTimelineEntry(taskEntry, 'up')}
                        onMoveDown={() => moveTimelineEntry(taskEntry, 'down')}
                        disableUp={taskIdx <= 0}
                        disableDown={taskIdx === timelineOrderEntries.length - 1}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-3">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="flex flex-col items-center gap-1 pt-1 text-los-text-muted/70">
                            {isDesktop && (
                              <span className="hidden text-xs select-none md:inline" aria-label="Drag to reorder" title="Drag to reorder">
                                ⠿
                              </span>
                            )}
                            <Checkbox
                              checked={done}
                              onChange={() => toggleWorkItem(pi.workItemId)}
                            />
                          </div>

                          <div
                            className={`shrink-0 w-1 self-stretch rounded-full ${priorityColor[pi.priority]}`}
                          />

                          <div className="min-w-0 flex-1 py-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${priorityColor[pi.priority]}`}
                              >
                                {pi.priority}
                              </span>
                              <p className={`text-sm font-medium ${done ? 'text-los-text-muted line-through' : 'text-los-text-primary'}`}>
                                {block.title}
                              </p>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 rounded bg-los-gold px-2 py-0.5 text-[10px] font-medium text-los-text-inverse animate-pulse">
                                  ● FOCUS
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-los-text-secondary tabular-nums">
                              {pi.estimatedDuration} minutes
                              {focusMs > 0 && (
                                <span className="text-los-text-muted"> · Focused {formatFocusTime(focusMs)}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex w-full flex-wrap gap-1 sm:w-auto sm:shrink-0 sm:flex-col">
                          <Button
                            variant={isActive ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleFocus(pi)}
                            className="flex-1 sm:flex-none"
                          >
                            {isActive ? 'Stop' : 'Focus'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditItem(pi)} className="flex-1 sm:flex-none">
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddBreakAfter(pi.id)}
                            className="flex-1 text-los-text-secondary sm:flex-none"
                          >
                            + Break
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromPlan(pi.id)}
                            className="flex-1 text-red-400 hover:text-red-600 hover:bg-red-50 sm:flex-none"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {editItem && (
        <EditPlanItemModal
          key={editItem.id + editItem.estimatedDuration + editItem.priority}
          item={editItem}
          onSave={handleSave}
          onClose={() => setEditItem(null)}
        />
      )}

      {showAddRoutine && <AddRoutineToPlanModal onClose={() => setShowAddRoutine(false)} />}
    </div>
  )
}
