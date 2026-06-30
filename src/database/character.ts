import type { CharacterArea } from '@/types'

const STORAGE_KEY = 'life_os_character'

const DEFAULT_AREAS: CharacterArea[] = [
  {
    id: 'discipline', name: 'Discipline',
    description: 'Consistency, willpower, and self-mastery in daily actions.',
    tips: 'Start with one non-negotiable daily habit. Track streaks, not slips.',
    level: 1, status: 'active',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'health', name: 'Health',
    description: 'Physical vitality, nutrition, and overall well-being.',
    tips: 'Prioritize sleep, hydration, and movement before optimizing.',
    level: 1, status: 'active',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'wealth', name: 'Wealth',
    description: 'Financial literacy, abundance, and resource management.',
    tips: 'Track spending for 30 days before making big changes.',
    level: 1, status: 'active',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'knowledge', name: 'Knowledge',
    description: 'Learning, curiosity, and intellectual growth.',
    tips: 'Read 10 pages a day. Consistency beats intensity.',
    level: 1, status: 'active',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'relationships', name: 'Relationships',
    description: 'Connection, empathy, and meaningful bonds with others.',
    tips: 'Reach out to one person daily. Listen more than you speak.',
    level: 1, status: 'active',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
]

export function getCharacterAreas(): CharacterArea[] {
  if (typeof window === 'undefined') return DEFAULT_AREAS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AREAS))
    return DEFAULT_AREAS
  }
  try {
    const parsed = JSON.parse(raw) as CharacterArea[]
    const now = Date.now()
    const existingIds = new Set(parsed.map((a) => a.id))
    const merged = [...parsed]
    for (const def of DEFAULT_AREAS) {
      if (!existingIds.has(def.id)) {
        merged.push({ ...def, createdAt: now, updatedAt: now })
      }
    }
    if (merged.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    }
    return merged.filter((a) => a.status !== 'deleted')
  } catch {
    return DEFAULT_AREAS
  }
}

export function getAllCharacterAreas(): CharacterArea[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CharacterArea[]
  } catch {
    return []
  }
}

function saveAreas(areas: CharacterArea[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(areas))
}

export function saveCharacterArea(updated: CharacterArea): CharacterArea[] {
  const areas = getAllCharacterAreas()
  const idx = areas.findIndex((a) => a.id === updated.id)
  if (idx >= 0) {
    areas[idx] = { ...updated, status: updated.status ?? 'active', updatedAt: Date.now() }
  } else {
    areas.push({ ...updated, status: 'active', createdAt: Date.now(), updatedAt: Date.now() })
  }
  saveAreas(areas)
  return getCharacterAreas()
}

export function setCharacterLevel(id: string, level: number): CharacterArea[] {
  const areas = getAllCharacterAreas()
  const idx = areas.findIndex((a) => a.id === id)
  if (idx === -1) return getCharacterAreas()
  areas[idx].level = Math.max(1, Math.min(10, level))
  areas[idx].updatedAt = Date.now()
  saveAreas(areas)
  return getCharacterAreas()
}

export function deleteCharacterArea(id: string): CharacterArea[] {
  const areas = getAllCharacterAreas()
  const idx = areas.findIndex((a) => a.id === id)
  if (idx === -1) return getCharacterAreas()
  areas[idx].status = 'deleted'
  areas[idx].updatedAt = Date.now()
  saveAreas(areas)
  return getCharacterAreas()
}

export function restoreCharacterArea(id: string): CharacterArea[] {
  const areas = getAllCharacterAreas()
  const idx = areas.findIndex((a) => a.id === id)
  if (idx === -1) return getCharacterAreas()
  areas[idx].status = 'active'
  areas[idx].updatedAt = Date.now()
  saveAreas(areas)
  return getCharacterAreas()
}

export function permanentDeleteCharacterArea(id: string): CharacterArea[] {
  const areas = getAllCharacterAreas().filter((a) => a.id !== id)
  saveAreas(areas)
  return getCharacterAreas()
}

export function updateCharacterArea(id: string, patch: Partial<Omit<CharacterArea, 'id' | 'createdAt'>>): CharacterArea[] {
  const areas = getAllCharacterAreas()
  const idx = areas.findIndex((a) => a.id === id)
  if (idx === -1) return getCharacterAreas()
  areas[idx] = { ...areas[idx], ...patch, updatedAt: Date.now() }
  saveAreas(areas)
  return getCharacterAreas()
}

export function updateCharacterDescription(id: string, description: string): CharacterArea[] {
  return updateCharacterArea(id, { description })
}
