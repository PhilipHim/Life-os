import type { ProfileStats } from '@/lib/profile/types'
import {
  ACHIEVEMENT_DEFINITIONS,
  type Achievement,
  type AchievementCategory,
} from '@/lib/achievements/definitions'
import { getAchievementUnlocks, syncAchievementUnlocks } from '@/lib/achievements/storage'

function buildProgressLabel(
  current: number,
  target: number,
  formatValue?: (value: number) => string
): string {
  const display = formatValue ? formatValue(current) : String(current)
  const targetDisplay = formatValue ? formatValue(target) : String(target)
  return `${display} / ${targetDisplay}`
}

export function computeAchievements(stats: ProfileStats): Achievement[] {
  const unlocks = getAchievementUnlocks()
  const now = Date.now()
  const pendingUnlocks: { id: string; timestamp: number }[] = []

  const computed = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const rawValue = def.getValue(stats)
    const wasUnlocked = unlocks[def.id] != null
    const meetsTarget = rawValue >= def.target

    if (meetsTarget && !wasUnlocked) {
      pendingUnlocks.push({ id: def.id, timestamp: now })
    }

    const progress =
      def.target > 0 ? Math.min(100, Math.round((Math.min(rawValue, def.target) / def.target) * 100)) : 100

    return {
      id: def.id,
      category: def.category,
      title: def.title,
      description: def.description,
      unlocked: wasUnlocked || meetsTarget,
      current: rawValue,
      target: def.target,
      progress: wasUnlocked || meetsTarget ? 100 : progress,
      progressLabel: buildProgressLabel(Math.min(rawValue, def.target), def.target, def.formatValue),
      unlockedAt: unlocks[def.id] ?? null,
    }
  })

  const updatedUnlocks = syncAchievementUnlocks(pendingUnlocks)

  return computed.map((achievement) => ({
    ...achievement,
    unlockedAt: updatedUnlocks[achievement.id] ?? achievement.unlockedAt,
    unlocked: updatedUnlocks[achievement.id] != null || achievement.unlocked,
    progress: updatedUnlocks[achievement.id] != null || achievement.unlocked ? 100 : achievement.progress,
  }))
}

export function groupAchievementsByCategory(
  achievements: Achievement[]
): Record<AchievementCategory, Achievement[]> {
  return achievements.reduce(
    (groups, achievement) => {
      groups[achievement.category].push(achievement)
      return groups
    },
    {
      task: [] as Achievement[],
      journal: [] as Achievement[],
      health: [] as Achievement[],
      habit: [] as Achievement[],
    }
  )
}

export {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_CATEGORY_LABELS,
  type Achievement,
  type AchievementCategory,
  type AchievementDefinition,
} from '@/lib/achievements/definitions'
