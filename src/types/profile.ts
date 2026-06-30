export const FOCUS_AREA_OPTIONS = [
  'Career',
  'Business',
  'Productivity',
  'Health',
  'Fitness',
  'Learning',
  'Finance',
  'Relationships',
  'Creativity',
  'Mindfulness',
] as const

export type FocusArea = (typeof FOCUS_AREA_OPTIONS)[number]

export interface UserProfile {
  id: string
  displayName: string
  activeTitleId: string
  onboardingCompletedAt: string | null
  focusAreas: FocusArea[]
  vision: string | null
  wakeUpTime: string | null
  bedtime: string | null
  deepWorkTime: string | null
  workoutTime: string | null
  firstMissionCompletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OnboardingPayload {
  focusAreas: FocusArea[]
  vision: string
}
