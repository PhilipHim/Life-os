'use client'

import { useState, useMemo } from 'react'
import type { DailyPlanItem } from '@/lib/types'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import { useFocus } from '@/lib/FocusContext'
import { useWorkItems } from '@/lib/WorkItemContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EditPlanItemModal from '@/components/EditPlanItemModal'

const priorityOrder: Record<string, number> = { H1: 0, H2: 1, M: 2, L: 3 }

const priorityColor: Record<string, string> = {
  H1: 'bg-red-500',
  H2: 'bg-orange-400',
  M: 'bg-blue-500',
  L: 'bg-gray-400',
}

function formatTime(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

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

const DAY_START = 9 * 60
const BREAK_DURATION = 15

export default function PlanPage() {
  const { todayPlan, removeFromPlan, updatePlanItem, movePlanItem } = useDailyPlan()
  const { activeWorkItemId, startFocus, stopFocus, focusSessions } = useFocus()
  const { workItems } = useWorkItems()
  const [editItem, setEditItem] = useState<DailyPlanItem | null>(null)

  const sorted = useMemo(() => {
    return [...todayPlan].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [todayPlan])

  const timeline = useMemo(() => {
    const blocks: { type: 'task' | 'break'; start: number; end: number; label: string; planItem?: typeof sorted[0] }[] = []
    let cursor = DAY_START

    for (const item of sorted) {
      const wi = workItems.find((w) => w.id === item.workItemId)
      const title = wi?.title ?? 'Unknown task'

      blocks.push({
        type: 'task',
        start: cursor,
        end: cursor + item.estimatedDuration,
        label: title,
        planItem: item,
      })
      cursor += item.estimatedDuration

      if (cursor < 24 * 60) {
        blocks.push({
          type: 'break',
          start: cursor,
          end: cursor + BREAK_DURATION,
          label: 'Break',
        })
        cursor += BREAK_DURATION
      }
    }

    return blocks
  }, [sorted, workItems])

  const handleSave = (updated: DailyPlanItem) => {
    updatePlanItem(updated)
  }

  const handleFocus = (pi: DailyPlanItem) => {
    if (activeWorkItemId === pi.workItemId) {
      stopFocus()
    } else {
      const wi = workItems.find((w) => w.id === pi.workItemId)
      startFocus(pi.workItemId, wi?.title ?? 'Unknown task')
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Today Plan</h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate(today())}</p>
      </div>

      {sorted.length === 0 && (
        <Card>
          <p className="text-center text-sm text-gray-400 py-6">
            No tasks planned for today. Add tasks from the Work page.
          </p>
        </Card>
      )}

      <div className="relative">
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200" />

        <div className="space-y-0">
          {timeline.map((block, idx) => {
            if (block.type === 'break') {
              return (
                <div key={`break-${idx}`} className="flex items-center gap-4 py-2">
                  <div className="w-[72px] text-right">
                    <span className="text-xs text-gray-400">{formatTime(block.start)}</span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                  <span className="text-xs text-gray-400 pr-2">{Math.round((block.end - block.start) / 60 * 10) / 10}h break</span>
                </div>
              )
            }

            const pi = block.planItem!
            const wi = workItems.find((w) => w.id === pi.workItemId)
            const done = wi?.status === 'completed'
            const sortedIdx = sorted.findIndex((s) => s.id === pi.id)
            const isFirst = sortedIdx === 0
            const isLast = sortedIdx === sorted.length - 1
            const isActive = activeWorkItemId === pi.workItemId
            const focusMs = focusSessions
              .filter((s) => s.workItemId === pi.workItemId && s.duration > 0)
              .reduce((sum, s) => sum + s.duration, 0)

            return (
              <div key={pi.id} className={`relative flex gap-4 py-1.5 ${isActive ? 'opacity-100' : ''}`}>
                <div className="w-[72px] pt-1 text-right">
                  <span className="text-xs font-medium text-gray-400">{formatTime(block.start)}</span>
                  <span className="block text-xs text-gray-300">{formatTime(block.end)}</span>
                </div>

                <div className="relative flex-1">
                  <div className="absolute -left-[19px] top-3 size-3 rounded-full border-2 border-white bg-gray-900 shadow-sm" />

                  <Card className={`transition-all hover:border-gray-300 hover:shadow-md ${isActive ? 'ring-2 ring-gray-900 bg-gray-50' : ''}`}>
                    <div className="flex gap-3">
                      <div
                        className={`shrink-0 w-1 self-stretch rounded-full ${priorityColor[pi.priority]}`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${priorityColor[pi.priority]}`}
                          >
                            {pi.priority}
                          </span>
                          <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {block.label}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white animate-pulse">
                              ● FOCUS
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{pi.estimatedDuration} min</span>
                          {pi.startTime && (
                            <span className="text-xs text-gray-400">Start: {pi.startTime}</span>
                          )}
                          {focusMs > 0 && (
                            <span className="text-xs text-gray-400">
                              Focused: {formatFocusTime(focusMs)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-between shrink-0">
                        <div className="flex flex-col items-center border-b border-gray-100 pb-1.5 mb-1.5">
                          <button
                            onClick={() => movePlanItem(pi.id, 'up')}
                            disabled={isFirst}
                            className="p-0.5 text-gray-400 hover:text-gray-900 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors text-sm leading-none"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => movePlanItem(pi.id, 'down')}
                            disabled={isLast}
                            className="p-0.5 text-gray-400 hover:text-gray-900 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors text-sm leading-none"
                          >
                            ▼
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant={isActive ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleFocus(pi)}
                          >
                            {isActive ? 'Stop' : 'Focus'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditItem(pi)}>Edit</Button>
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
                    </div>
                  </Card>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {editItem && (
        <EditPlanItemModal
          item={editItem}
          onSave={handleSave}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
