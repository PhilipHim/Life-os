import type { ChallengeInstance, GenerationContext } from '@/lib/challenges/types'
import {
  CHALLENGE_TEMPLATES,
  DAILY_TEMPLATES,
  WEEKLY_TEMPLATES,
  type ChallengeTemplate,
} from '@/lib/challenges/templates'

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function sortTemplatesBySeed(templates: ChallengeTemplate[], seed: string): ChallengeTemplate[] {
  return [...templates].sort((a, b) => hashString(seed + a.id) - hashString(seed + b.id))
}

function wasRecentlyUsed(templateId: string, recentIds: string[]): boolean {
  const lastThree = recentIds.slice(-6)
  return lastThree.filter((id) => id === templateId).length >= 2
}

function buildInstance(
  template: ChallengeTemplate,
  periodKey: string,
  target: number,
  meta: Record<string, number>
): ChallengeInstance {
  const id = `${template.period}:${periodKey}:${template.id}`
  return {
    id,
    templateId: template.id,
    period: template.period,
    periodKey,
    module: template.module,
    title: template.title(target, meta),
    description: template.description(target, meta),
    target,
    xpReward: template.xpReward(target, meta),
    meta,
    current: 0,
    progress: 0,
    completed: false,
    completedAt: null,
  }
}

function pickChallenges(
  templates: ChallengeTemplate[],
  periodKey: string,
  ctx: GenerationContext,
  count: number
): ChallengeInstance[] {
  const eligible = templates.filter((t) => !wasRecentlyUsed(t.id, ctx.recentTemplateIds))
  const sorted = sortTemplatesBySeed(eligible.length >= count ? eligible : templates, periodKey)

  const picked: ChallengeInstance[] = []
  const usedModules = new Set<string>()

  for (const template of sorted) {
    if (picked.length >= count) break
    const pickedTarget = template.pickTarget(ctx)
    if (!pickedTarget) continue
    if (usedModules.has(template.module)) continue

    picked.push(
      buildInstance(template, periodKey, pickedTarget.target, pickedTarget.meta)
    )
    usedModules.add(template.module)
  }

  if (picked.length < count) {
    for (const template of sorted) {
      if (picked.length >= count) break
      if (picked.some((p) => p.templateId === template.id)) continue
      const pickedTarget = template.pickTarget(ctx)
      if (!pickedTarget) continue

      picked.push(
        buildInstance(template, periodKey, pickedTarget.target, pickedTarget.meta)
      )
    }
  }

  return picked.slice(0, count)
}

export function generateDailyChallenges(periodKey: string, ctx: GenerationContext): ChallengeInstance[] {
  return pickChallenges(DAILY_TEMPLATES, periodKey, ctx, 3)
}

export function generateWeeklyChallenges(periodKey: string, ctx: GenerationContext): ChallengeInstance[] {
  return pickChallenges(WEEKLY_TEMPLATES, periodKey, ctx, 3)
}

export function getTemplateById(templateId: string): ChallengeTemplate | undefined {
  return CHALLENGE_TEMPLATES.find((t) => t.id === templateId)
}
