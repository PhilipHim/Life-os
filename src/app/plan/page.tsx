'use client'

import { useState, useMemo, useCallback } from 'react'
import type { DailyPlanItem, WorkItem } from '@/lib/types'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { useFocus } from '@/lib/FocusContext'
import { useWorkItems } from '@/lib/WorkItemContext'
import {
  buildExecutionQueue,
  summarizeExecution,
  formatMinutes,
  type ExecutionBlock,
} from '@/lib/planner'
import {
  getPlannerBreakState,
  addManualBreak,
  removeBreak,
  resetPlannerBreaks,
} from '@/lib/db/planner-breaks'
import { getPlannerDefaults, setPlannerDefaults } from '@/lib/planner-defaults'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import EditPlanItemModal from '@/components/EditPlanItemModal'

const priorityColor: Record<string, string> = {
  H1: 'bg-red-500',
  H2: 'bg-orange-400',
  M: 'bg-blue-500',
  L: 'bg-gray-400',
}

const priorities = ['H1', 'H2', 'M', 'L'] as const

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

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
  const { todayPlan, addToPlan, removeFromPlan, updatePlanItem, reorderPlanItems, autoPlanToday } =
    useDailyPlan()
  const { activeWorkItemId, startFocus, stopFocus, focusSessions } = useFocus()
  const { workItems, toggleWorkItem } = useWorkItems()

  const todayStr = today()
  const [editItem, setEditItem] = useState<DailyPlanItem | null>(null)
  const [breakState, setBreakState] = useState(() => getPlannerBreakState(todayStr))
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [defaultsVersion, setDefaultsVersion] = useState(0)
  const [autoPlanFeedback, setAutoPlanFeedback] = useState<string | null>(null)

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

  const handleTaskDragStart = (planItemId: string) => {
    setDragTaskId(planItemId)
  }

  const handleTaskDrop = (targetPlanItemId: string) => {
    if (!dragTaskId || dragTaskId === targetPlanItemId) return
    const ids = todayPlan.map((t) => t.id)
    const fromIdx = ids.indexOf(dragTaskId)
    const toIdx = ids.indexOf(targetPlanItemId)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...ids]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    reorderPlanItems(next)
    setDragTaskId(null)
  }

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
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Execution Plan</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDate(todayStr)}</p>
          <p className="text-sm text-gray-400 mt-0.5">
            Build today&apos;s queue — prioritize, reorder, and execute.
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
          <Button variant="secondary" disabled={!canAutoPlan} onClick={handleAutoPlan}>
            Auto Plan
          </Button>
          {!canAutoPlan ? (
            <p className="text-xs text-gray-400 sm:text-right">No tasks available for planning.</p>
          ) : (
            <p className="text-xs text-gray-400 sm:text-right">
              Pulls {planableTasks.length} task{planableTasks.length !== 1 ? 's' : ''} from Work, sorts by priority, and builds today&apos;s queue.
            </p>
          )}
          {autoPlanFeedback && (
            <p className="text-xs text-amber-700 sm:text-right">{autoPlanFeedback}</p>
          )}
        </div>
      </div>

      {summary.totalTasks > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Planned Tasks</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{summary.totalTasks}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Work Time</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
              {formatMinutes(summary.totalWorkMinutes)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Breaks</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
              {summary.breakCount}
              <span className="text-sm font-normal text-gray-400 ml-1">
                ({formatMinutes(summary.totalBreakMinutes)})
              </span>
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Completion</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
              {planCompleted}/{summary.totalTasks}
              <span className="text-sm font-normal text-gray-400 ml-1">({completionPct}%)</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </Card>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Available Tasks</h2>
        {availableTasks.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-sm text-gray-400">
              {planableTasks.length === 0
                ? 'No tasks available for planning.'
                : 'All active tasks are already in today\'s plan.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {availableTasks.map((task) => {
              const defaults = getPlannerDefaults(task.id)
              return (
                <Card key={task.id} className="p-4 transition-all hover:border-gray-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1">
                        {priorities.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleDefaultsChange(task.id, { priority: p })}
                            className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                              defaults.priority === p
                                ? `${priorityColor[p]} text-white`
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                        className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs tabular-nums shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        aria-label="Estimated minutes"
                      />
                      <span className="text-xs text-gray-400">min</span>
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
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Today&apos;s Plan</h2>
          {todayPlan.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => handleAddBreakAfter(null)}>
              + Add Break
            </Button>
          )}
        </div>

        {todayPlan.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-sm text-gray-400">
              Your execution queue is empty. Add tasks from Available Tasks above.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {executionQueue.map((block) => {
              if (block.kind === 'break') {
                return (
                  <Card
                    key={block.id}
                    className="border-dashed border-gray-200 bg-gray-50/80 py-3 px-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg text-gray-300">☕</span>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Break</p>
                          <p className="text-xs text-gray-400">
                            {block.durationMinutes} minutes
                            {block.auto && (
                              <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
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
                        className="text-gray-400 hover:text-red-500 shrink-0"
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
              const isDragging = dragTaskId === pi.id

              return (
                <div
                  key={pi.id}
                  draggable
                  onDragStart={() => handleTaskDragStart(pi.id)}
                  onDragEnd={() => setDragTaskId(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleTaskDrop(pi.id)
                  }}
                  className={isDragging ? 'opacity-50' : ''}
                >
                  <Card
                    className={`transition-all hover:border-gray-300 hover:shadow-md cursor-grab active:cursor-grabbing ${
                      isActive ? 'ring-2 ring-gray-900 bg-gray-50' : ''
                    } ${done ? 'opacity-75' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1 text-gray-300">
                        <span className="text-xs select-none" title="Drag to reorder">
                          ⠿
                        </span>
                        <Checkbox
                          checked={done}
                          onChange={() => toggleWorkItem(pi.workItemId)}
                        />
                      </div>

                      <div
                        className={`shrink-0 w-1 self-stretch rounded-full ${priorityColor[pi.priority]}`}
                      />

                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${priorityColor[pi.priority]}`}
                          >
                            {pi.priority}
                          </span>
                          <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {block.title}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white animate-pulse">
                              ● FOCUS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 tabular-nums">
                          {pi.estimatedDuration} minutes
                          {focusMs > 0 && (
                            <span className="text-gray-400"> · Focused {formatFocusTime(focusMs)}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant={isActive ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleFocus(pi)}
                        >
                          {isActive ? 'Stop' : 'Focus'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditItem(pi)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddBreakAfter(pi.id)}
                          className="text-gray-500"
                        >
                          + Break
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromPlan(pi.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
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
    </div>
  )
}
