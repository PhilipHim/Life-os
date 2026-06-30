import type { CharacterArea } from '@/types'
import type { CharacterCoachItem } from '@/lib/coach/types'

const TRAIT_ACTIONS: Record<string, string> = {
  Communication: 'Initiate one difficult conversation this week.',
  Discipline: 'Complete your first task before checking social media.',
  Leadership: 'Take ownership of one group decision this week.',
  Confidence: 'Say yes to one stretch opportunity that scares you slightly.',
  Wealth: 'Spend 20 minutes researching a new income source.',
  Health: 'Log health metrics every day this week — consistency builds the trait.',
  Knowledge: 'Read for 20 minutes on a topic outside your comfort zone.',
  Relationships: 'Reach out to one person you have not spoken to in 30 days.',
  Creativity: 'Ship one small creative output this week, even if imperfect.',
  Resilience: 'When something goes wrong today, write down one lesson before moving on.',
}

function actionForTrait(name: string, level: number): string {
  if (TRAIT_ACTIONS[name]) return TRAIT_ACTIONS[name]
  if (level <= 2) {
    return `Define one concrete weekly habit that directly builds ${name}, then track it daily.`
  }
  if (level <= 5) {
    return `Pick one measurable ${name} challenge this week and review progress on Friday.`
  }
  return `Teach or mentor someone in ${name} — teaching reinforces mastery.`
}

export function buildCharacterCoach(areas: CharacterArea[], limit = 3): CharacterCoachItem[] {
  return [...areas]
    .filter((a) => a.status === 'active')
    .sort((a, b) => a.level - b.level)
    .slice(0, limit)
    .map((area) => ({
      name: area.name,
      level: area.level,
      recommendation: actionForTrait(area.name, area.level),
    }))
}

export function getBestCharacterImprovement(areas: CharacterArea[]): string | null {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentlyUpdated = areas
    .filter((a) => a.updatedAt >= weekAgo && a.status === 'active')
    .sort((a, b) => b.level - a.level)
  return recentlyUpdated[0]?.name ?? null
}
