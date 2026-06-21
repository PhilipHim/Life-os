export const XP_REWARDS = {
  taskCompleted: 10,
  highPriorityTask: 20,
  habitCompleted: 5,
  journalEntry: 10,
  sleepScore80: 10,
  workoutLogged: 10,
  healthScore80: 10,
} as const

export const HIGH_PRIORITIES = new Set(['H1', 'H2'])
