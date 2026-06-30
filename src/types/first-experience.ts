export type FirstMissionObjective = 'task' | 'routine' | 'planner' | 'activity'

export type ContextualHintSection = 'planner' | 'tasks' | 'routines' | 'analytics'

export interface FirstMissionProgress {
  task: boolean
  routine: boolean
  planner: boolean
  activity: boolean
}

export interface FirstExperienceState {
  welcomeDismissed: boolean
  objectives: FirstMissionProgress
  hintsDismissed: Record<ContextualHintSection, boolean>
  completedAt: number | null
}

export const FIRST_MISSION_XP = 250
export const FIRST_MISSION_TITLE_ID = 'the_beginner'
