import type { BusinessIdea } from '@/types'

const STORAGE_KEY = 'life_os_business_ideas'

export const IDEA_CATEGORIES = [
  'Startup',
  'App',
  'AI Business',
  'Content',
  'Project',
  'Other',
] as const

export function getBusinessIdeas(): BusinessIdea[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as BusinessIdea[]
  } catch {
    return []
  }
}

function saveItems(items: BusinessIdea[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function saveBusinessIdea(item: BusinessIdea): BusinessIdea[] {
  const items = getBusinessIdeas()
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    items[idx] = item
  } else {
    items.push(item)
  }
  saveItems(items)
  return getBusinessIdeas()
}

export function deleteBusinessIdea(id: string): BusinessIdea[] {
  saveItems(getBusinessIdeas().filter((i) => i.id !== id))
  return getBusinessIdeas()
}
