import { computeProfileStats } from '@/lib/profile/stats'
import { computeProgress } from '@/lib/profile/progression'
import { computeAchievements } from '@/lib/achievements'
import { computeTitles } from '@/lib/titles'
import { getTotalXp, getXpHistory } from '@/lib/xp'
import { getProfileSettings } from '@/lib/db/profile'
import type { ProfileData } from '@/lib/profile/types'

export function buildProfileData(): ProfileData {
  const stats = computeProfileStats()
  const totalXp = getTotalXp()
  const achievements = computeAchievements(stats)
  const settings = getProfileSettings()
  const titles = computeTitles(stats, computeProgress(totalXp), achievements, settings.activeTitleId)
  const progress = computeProgress(totalXp, titles.activeTitle.name)
  const xpHistory = getXpHistory()

  return {
    stats,
    progress,
    achievements,
    titles,
    xpHistory: {
      daily: xpHistory.daily,
      weekly: xpHistory.weekly,
      monthly: xpHistory.monthly,
    },
  }
}

export type { ProfileData, ProfileStats, ProfileProgress, Achievement } from '@/lib/profile/types'
export type { UserTitle, TitleState } from '@/lib/titles/definitions'
