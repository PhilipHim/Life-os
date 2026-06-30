import type { Project } from '@/types'

const STORAGE_KEY = 'productivity_projects'

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const projects = JSON.parse(raw) as Project[]
    return projects.map((p) => ({
      ...p,
      taskIds: Array.isArray((p as any).taskIds) ? (p as any).taskIds : [],
      description: p.description || '',
      notes: p.notes || '',
      createdAt: p.createdAt || Date.now(),
      completed: p.completed ?? false,
    }))
  } catch {
    return []
  }
}

function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function addProject(project: Project): Project[] {
  const projects = getProjects()
  saveProjects([...projects, project])
  return getProjects()
}

export function updateProject(updated: Project): Project[] {
  const projects = getProjects()
  saveProjects(projects.map((p) => (p.id === updated.id ? updated : p)))
  return getProjects()
}

export function deleteProject(id: string): Project[] {
  saveProjects(getProjects().filter((p) => p.id !== id))
  return getProjects()
}

export function getProjectsCount(): number {
  return getProjects().length
}
