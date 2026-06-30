import type {
  ContextualHintSection,
  FirstExperienceState,
  FirstMissionObjective,
  FirstMissionProgress,
} from '@/types/first-experience'

const STORAGE_KEY = 'ascend_first_experience'

const DEFAULT_OBJECTIVES: FirstMissionProgress = {
  task: false,
  routine: false,
  planner: false,
  activity: false,
}

const DEFAULT_HINTS: Record<ContextualHintSection, boolean> = {
  planner: false,
  tasks: false,
  routines: false,
  analytics: false,
}

export const DEFAULT_FIRST_EXPERIENCE: FirstExperienceState = {
  welcomeDismissed: false,
  objectives: { ...DEFAULT_OBJECTIVES },
  hintsDismissed: { ...DEFAULT_HINTS },
  completedAt: null,
}

export function getFirstExperienceState(): FirstExperienceState {
  if (typeof window === 'undefined') return { ...DEFAULT_FIRST_EXPERIENCE }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_FIRST_EXPERIENCE }
  try {
    const parsed = JSON.parse(raw) as Partial<FirstExperienceState>
    return {
      welcomeDismissed: parsed.welcomeDismissed ?? false,
      objectives: { ...DEFAULT_OBJECTIVES, ...parsed.objectives },
      hintsDismissed: { ...DEFAULT_HINTS, ...parsed.hintsDismissed },
      completedAt: parsed.completedAt ?? null,
    }
  } catch {
    return { ...DEFAULT_FIRST_EXPERIENCE }
  }
}

function saveFirstExperienceState(state: FirstExperienceState): FirstExperienceState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return state
}

export function emitFirstExperienceUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('first-experience-updated'))
  }
}

export function isFirstExperienceComplete(): boolean {
  return getFirstExperienceState().completedAt != null
}

export function markWelcomeDismissed(): FirstExperienceState {
  const state = saveFirstExperienceState({
    ...getFirstExperienceState(),
    welcomeDismissed: true,
  })
  emitFirstExperienceUpdated()
  return state
}

export function markObjectiveComplete(objective: FirstMissionObjective): FirstExperienceState {
  const current = getFirstExperienceState()
  if (current.completedAt || current.objectives[objective]) return current

  const state = saveFirstExperienceState({
    ...current,
    objectives: { ...current.objectives, [objective]: true },
  })
  emitFirstExperienceUpdated()
  return state
}

export function markHintDismissed(section: ContextualHintSection): FirstExperienceState {
  const current = getFirstExperienceState()
  if (current.hintsDismissed[section]) return current

  const state = saveFirstExperienceState({
    ...current,
    hintsDismissed: { ...current.hintsDismissed, [section]: true },
  })
  emitFirstExperienceUpdated()
  return state
}

export function markFirstExperienceComplete(): FirstExperienceState {
  const state = saveFirstExperienceState({
    ...getFirstExperienceState(),
    completedAt: Date.now(),
    welcomeDismissed: true,
    objectives: {
      task: true,
      routine: true,
      planner: true,
      activity: true,
    },
  })
  emitFirstExperienceUpdated()
  return state
}

export function allObjectivesComplete(objectives: FirstMissionProgress): boolean {
  return objectives.task && objectives.routine && objectives.planner && objectives.activity
}
