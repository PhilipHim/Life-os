import type { Achievement, ProfileProgress, ProfileStats } from '@/lib/profile/types'
import {
  TITLE_DEFINITIONS,
  DEFAULT_TITLE_ID,
  type TitleDefinition,
  type TitleState,
  type UserTitle,
} from '@/lib/titles/definitions'
import { getTitleUnlocks, syncTitleUnlocks } from '@/lib/titles/storage'

interface TitleContext {
  level: number
  stats: ProfileStats
  achievements: Achievement[]
}

function isAchievementUnlocked(ctx: TitleContext, id: string): boolean {
  return ctx.achievements.find((a) => a.id === id)?.unlocked ?? false
}

function countUnlockedAchievements(ctx: TitleContext): number {
  return ctx.achievements.filter((a) => a.unlocked).length
}

function meetsCondition(def: TitleDefinition, ctx: TitleContext): boolean {
  switch (def.id) {
    case 'beginner':
      return true
    case 'the_beginner':
      return false
    case 'pathfinder':
      return (
        ctx.level >= 2 ||
        isAchievementUnlocked(ctx, 'first_mission')
      )
    case 'builder':
      return (
        ctx.level >= 3 ||
        isAchievementUnlocked(ctx, 'first_task') ||
        ctx.stats.longestHabitStreak >= 7
      )
    case 'steady_hand':
      return (
        ctx.level >= 5 ||
        isAchievementUnlocked(ctx, 'habit_warrior') ||
        countUnlockedAchievements(ctx) >= 3
      )
    case 'focused_builder':
      return (
        ctx.level >= 7 ||
        isAchievementUnlocked(ctx, 'focused') ||
        ctx.stats.journalEntries >= 30
      )
    case 'focus_monk':
      return (
        ctx.level >= 8 ||
        isAchievementUnlocked(ctx, 'focus_marathon') ||
        isAchievementUnlocked(ctx, 'focus_locked_in')
      )
    case 'disciplined_operator':
      return (
        ctx.level >= 10 ||
        isAchievementUnlocked(ctx, 'consistent') ||
        countUnlockedAchievements(ctx) >= 5
      )
    case 'chronicler':
      return (
        ctx.level >= 12 ||
        isAchievementUnlocked(ctx, 'journal_mindful') ||
        ctx.stats.currentStreaks.journal >= 14
      )
    case 'life_architect':
      return (
        ctx.level >= 15 ||
        isAchievementUnlocked(ctx, 'writer') ||
        (ctx.stats.lifeScoreAverage ?? 0) >= 65
      )
    case 'peak_performer':
      return (
        ctx.level >= 18 ||
        isAchievementUnlocked(ctx, 'master_executor') ||
        (ctx.stats.productivityScoreAverage ?? 0) >= 75
      )
    case 'master_architect':
      return (
        ctx.level >= 20 ||
        isAchievementUnlocked(ctx, 'master_executor') ||
        isAchievementUnlocked(ctx, 'iron_health') ||
        ctx.stats.longestHabitStreak >= 30
      )
    case 'ascendant':
      return (
        ctx.level >= 25 ||
        countUnlockedAchievements(ctx) >= 12 ||
        (ctx.stats.lifeScoreAverage ?? 0) >= 75
      )
    default:
      return false
  }
}

function buildUnlockHint(def: TitleDefinition): string {
  if (def.conditions.length === 0) return 'Available from the start'
  return def.conditions.map((c) => c.label).join(' · ')
}

function resolveActiveTitleId(
  titles: UserTitle[],
  preferredId: string | undefined
): string {
  const unlocked = titles.filter((t) => t.unlocked)
  if (unlocked.length === 0) return DEFAULT_TITLE_ID

  if (preferredId && unlocked.some((t) => t.id === preferredId)) {
    return preferredId
  }

  const order = TITLE_DEFINITIONS.map((d) => d.id)
  for (let i = order.length - 1; i >= 0; i--) {
    if (unlocked.some((t) => t.id === order[i])) return order[i]
  }

  return DEFAULT_TITLE_ID
}

export function computeTitles(
  stats: ProfileStats,
  progress: ProfileProgress,
  achievements: Achievement[],
  activeTitleId?: string
): TitleState {
  const ctx: TitleContext = { level: progress.level, stats, achievements }
  const storedUnlocks = getTitleUnlocks()
  const now = Date.now()
  const pendingUnlocks: { id: string; timestamp: number }[] = []

  const titles: UserTitle[] = TITLE_DEFINITIONS.map((def) => {
    const wasUnlocked = storedUnlocks[def.id] != null
    const meetsTarget = meetsCondition(def, ctx)

    if (meetsTarget && !wasUnlocked) {
      pendingUnlocks.push({ id: def.id, timestamp: now })
    }

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      unlocked: wasUnlocked || meetsTarget,
      isActive: false,
      unlockHint: buildUnlockHint(def),
      conditions: def.conditions,
      unlockedAt: storedUnlocks[def.id] ?? null,
    }
  })

  const unlocks = syncTitleUnlocks(pendingUnlocks)

  const resolvedTitles = titles.map((title) => ({
    ...title,
    unlockedAt: unlocks[title.id] ?? title.unlockedAt,
    unlocked: unlocks[title.id] != null || title.unlocked,
  }))

  const activeId = resolveActiveTitleId(resolvedTitles, activeTitleId)
  const withActive = resolvedTitles.map((title) => ({
    ...title,
    isActive: title.id === activeId,
  }))

  const activeTitle =
    withActive.find((t) => t.id === activeId) ??
    withActive[0] ?? {
      id: DEFAULT_TITLE_ID,
      name: 'Beginner',
      description: '',
      unlocked: true,
      isActive: true,
      unlockHint: '',
      conditions: [],
      unlockedAt: null,
    }

  return {
    titles: withActive,
    activeTitle,
    unlockedCount: withActive.filter((t) => t.unlocked).length,
  }
}

export {
  TITLE_DEFINITIONS,
  DEFAULT_TITLE_ID,
  type TitleDefinition,
  type TitleState,
  type UserTitle,
} from '@/lib/titles/definitions'
