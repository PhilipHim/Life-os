export interface RoutineStepText {
  id: string
  type: 'text'
  text: string
}

export interface RoutineStepNested {
  id: string
  type: 'routine'
  routineId: string
}

export type RoutineStep = RoutineStepText | RoutineStepNested

export type RoutinePlacement = 'first' | 'last' | 'manual'

export interface RoutineTemplate {
  id: string
  name: string
  description: string
  steps: RoutineStep[]
  /** Default duration when adding to the planner. */
  estimatedDuration?: number
  createdAt: number
  updatedAt: number
}

export interface PlanRoutineBlock {
  id: string
  routineId: string
  date: string
  orderIndex: number
  estimatedDuration: number
  startTime?: string
  notes?: string
  /** Placement used when this block was last auto-positioned. */
  placement?: RoutinePlacement
  expanded: boolean
  completedSteps: Record<string, boolean>
  createdAt: number
}

/** Schedules a routine template into every new planner day until disabled. */
export interface RecurringRoutineSchedule {
  id: string
  routineId: string
  estimatedDuration: number
  placement: RoutinePlacement
  startTime?: string
  notes?: string
  enabled: boolean
  createdAt: number
  updatedAt: number
}
