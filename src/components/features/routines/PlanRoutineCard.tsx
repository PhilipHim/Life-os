'use client'

import { useState } from 'react'
import type { PlanRoutineBlock } from '@/types'
import { useRoutines } from '@/contexts/RoutineContext'
import { useDailyPlan } from '@/contexts/DailyPlanContext'
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
    <Card className={`border-violet-200 bg-violet-50/30 transition-all hover:border-violet-300 hover:shadow-los-card-hover ${draggable ? 'md:cursor-grab md:active:cursor-grabbing' : ''}`}>
      <div className="flex gap-3">
        {draggable && (
          <div className="hidden flex-col items-center gap-1 pt-1 text-los-text-muted/70 md:flex">
            <span className="text-xs select-none" title="Drag to reorder" aria-label="Drag to reorder">
              ⠿
            </span>
          </div>
        )}
        <div className="w-1 shrink-0 self-stretch rounded-full bg-violet-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                  ROUTINE
                </span>
                <p className="text-sm font-semibold text-los-text-primary">
                  {template?.name ?? 'Routine'}
                </p>
              </div>
              <p className="text-xs text-los-text-secondary mt-1 tabular-nums">
                {block.startTime && <span>{block.startTime} · </span>}
                {block.estimatedDuration} minutes
                {checkableSteps.length > 0 && (
                  <span className="text-los-text-muted">
                    {' '}
                    · {doneCount}/{checkableSteps.length} steps
                  </span>
                )}
              </p>
              {block.notes && (
                <p className="text-xs text-los-text-secondary mt-1 italic">{block.notes}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                  updatePlanRoutineBlock({ ...block, expanded: !block.expanded })
                }
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-los-text-muted hover:bg-los-bg-secondary hover:text-los-text-primary sm:min-h-0 sm:min-w-0 sm:p-1.5"
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
                <li className="text-xs text-los-text-muted">No steps in this routine.</li>
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
                            ? 'text-sm text-los-text-muted line-through'
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
