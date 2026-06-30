'use client'

import { useState } from 'react'
import type { PlanRoutineBlock } from '@/lib/types'
import { useRoutines } from '@/lib/RoutineContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'

interface PlanRoutineCardProps {
  block: PlanRoutineBlock
  draggable?: boolean
}

export default function PlanRoutineCard({ block, draggable }: PlanRoutineCardProps) {
  const { routines, getFlattenedSteps } = useRoutines()
  const { updatePlanRoutineBlock, removeRoutineFromPlan, toggleRoutineStepComplete } =
    useDailyPlan()

  const template = routines.find((r) => r.id === block.routineId)
  const steps = getFlattenedSteps(block.routineId)
  const checkableSteps = steps.filter((s) => s.kind === 'text')
  const doneCount = checkableSteps.filter((s) => block.completedSteps[s.key]).length

  return (
    <Card className={`border-violet-200 bg-violet-50/30 transition-all hover:border-violet-300 hover:shadow-md ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <div className="flex gap-3">
        {draggable && (
          <div className="flex flex-col items-center gap-1 pt-1 text-gray-300">
            <span className="text-xs select-none" title="Drag to reorder">
              ⠿
            </span>
          </div>
        )}
        <div className="shrink-0 w-1 self-stretch rounded-full bg-violet-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                  ROUTINE
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {template?.name ?? 'Routine'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1 tabular-nums">
                {block.startTime && <span>{block.startTime} · </span>}
                {block.estimatedDuration} minutes
                {checkableSteps.length > 0 && (
                  <span className="text-gray-400">
                    {' '}
                    · {doneCount}/{checkableSteps.length} steps
                  </span>
                )}
              </p>
              {block.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">{block.notes}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  updatePlanRoutineBlock({ ...block, expanded: !block.expanded })
                }
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
                aria-label={block.expanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  className={`size-4 transition-transform ${block.expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRoutineFromPlan(block.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </div>

          {block.expanded && (
            <ul className="mt-3 space-y-1 border-t border-violet-100 pt-3">
              {steps.length === 0 && (
                <li className="text-xs text-gray-400">No steps in this routine.</li>
              )}
              {steps.map((step) => (
                <li
                  key={step.key}
                  style={{ paddingLeft: `${step.depth * 16}px` }}
                  className="flex items-center gap-2 py-0.5"
                >
                  {step.kind === 'text' ? (
                    <>
                      <Checkbox
                        checked={!!block.completedSteps[step.key]}
                        onChange={() =>
                          toggleRoutineStepComplete(
                            block.id,
                            step.key,
                            !block.completedSteps[step.key]
                          )
                        }
                      />
                      <span
                        className={
                          block.completedSteps[step.key]
                            ? 'text-sm text-gray-400 line-through'
                            : 'text-sm text-gray-800'
                        }
                      >
                        {step.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-violet-700 flex items-center gap-1.5">
                      <span className="text-violet-400">▶</span>
                      {step.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
