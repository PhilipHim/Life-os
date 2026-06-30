import { getWorkItems } from '@/database/work-items'
import { getRoutineTemplates } from '@/database/routine-templates'
import { getAllSessions } from '@/lib/focus'
import { getDailyPlanItems } from '@/database/daily-plan'
import { saveActiveTitle } from '@/database/profile'
import { completeFirstMission } from '@/database/user-profile'
import {
  allObjectivesComplete,
  emitFirstExperienceUpdated,
  getFirstExperienceState,
  isFirstExperienceComplete,
  markFirstExperienceComplete,
  markObjectiveComplete,
} from '@/database/first-experience'
import { saveAchievementUnlock } from '@/lib/achievements/storage'
import { unlockTitleById } from '@/lib/titles/storage'
import { tryAwardXp } from '@/lib/xp/state'
import {
  FIRST_MISSION_TITLE_ID,
  FIRST_MISSION_XP,
  type FirstMissionObjective,
} from '@/types/first-experience'

const PLANNER_VISITED_KEY = 'ascend_planner_visited'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hasCompletedActivity(): boolean {
  const completedTask = getWorkItems().some((item) => item.status === 'completed')
  if (completedTask) return true

  const focusToday = getAllSessions().some(
    (session) => session.date === todayStr() && session.duration > 0
  )
  if (focusToday) return true

  try {
    const raw = localStorage.getItem('productivity_habit_entries')
    if (raw) {
      const entries = JSON.parse(raw) as { date: string; completed?: boolean }[]
      if (entries.some((entry) => entry.date === todayStr() && entry.completed)) {
        return true
      }
    }
  } catch {
    // ignore
  }

  return false
}

function syncObjectivesFromAppState(): void {
  const current = getFirstExperienceState()
  if (current.completedAt) return

  if (!current.objectives.task && getWorkItems().length > 0) {
    markObjectiveComplete('task')
  }
  if (!current.objectives.routine && getRoutineTemplates().length > 0) {
    markObjectiveComplete('routine')
  }
  if (!current.objectives.planner && sessionStorage.getItem(PLANNER_VISITED_KEY) === 'true') {
    markObjectiveComplete('planner')
  }
  if (!current.objectives.activity && hasCompletedActivity()) {
    markObjectiveComplete('activity')
  }
}

export function markPlannerVisited(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PLANNER_VISITED_KEY, 'true')
  markObjectiveComplete('planner')
  checkFirstMissionCompletion()
}

export function markFirstMissionObjective(objective: FirstMissionObjective): void {
  if (isFirstExperienceComplete()) return
  markObjectiveComplete(objective)
  checkFirstMissionCompletion()
}

function awardFirstMissionRewards(userId?: string): void {
  const date = todayStr()
  tryAwardXp('first_mission', FIRST_MISSION_XP, 'mission', date, 'First Mission Complete')
  unlockTitleById(FIRST_MISSION_TITLE_ID)
  saveActiveTitle(FIRST_MISSION_TITLE_ID)
  saveAchievementUnlock('first_mission', Date.now())
  markFirstExperienceComplete()

  if (userId) {
    void completeFirstMission(userId, FIRST_MISSION_TITLE_ID)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('first-mission-completed'))
  }
  emitFirstExperienceUpdated()
}

export function checkFirstMissionCompletion(userId?: string): boolean {
  if (isFirstExperienceComplete()) return false

  syncObjectivesFromAppState()
  const state = getFirstExperienceState()
  if (!allObjectivesComplete(state.objectives)) return false

  awardFirstMissionRewards(userId)
  return true
}

export function maybeAutoCompleteForVeteran(userId?: string): void {
  if (isFirstExperienceComplete()) return

  syncObjectivesFromAppState()

  const state = getFirstExperienceState()
  if (allObjectivesComplete(state.objectives)) {
    checkFirstMissionCompletion(userId)
    return
  }

  const hasTasks = getWorkItems().length > 0
  const hasRoutines = getRoutineTemplates().length > 0
  const visitedPlanner =
    sessionStorage.getItem(PLANNER_VISITED_KEY) === 'true' ||
    getDailyPlanItems().some((item) => item.date === todayStr())
  const hasActivity = hasCompletedActivity()

  if (hasTasks && hasRoutines && visitedPlanner && hasActivity) {
    markObjectiveComplete('task')
    markObjectiveComplete('routine')
    markObjectiveComplete('planner')
    markObjectiveComplete('activity')
    checkFirstMissionCompletion(userId)
  }
}
