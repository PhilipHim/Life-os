import type { RoutineStep, RoutineTemplate } from '@/types'

export interface FlatRoutineStep {
  key: string
  label: string
  depth: number
  kind: 'text' | 'nested-header'
  routineId?: string
}

export function flattenRoutineSteps(
  routineId: string,
  templates: RoutineTemplate[],
  prefix = '',
  depth = 0,
  visited = new Set<string>()
): FlatRoutineStep[] {
  if (visited.has(routineId)) {
    return [
      {
        key: `${prefix}cycle`,
        label: '(nested routine cycle)',
        depth,
        kind: 'text',
      },
    ]
  }

  const routine = templates.find((r) => r.id === routineId)
  if (!routine) {
    return [
      {
        key: `${prefix}missing`,
        label: '(missing routine)',
        depth,
        kind: 'text',
      },
    ]
  }

  const nextVisited = new Set(visited)
  nextVisited.add(routineId)
  const flat: FlatRoutineStep[] = []

  for (const step of routine.steps) {
    const stepKey = prefix ? `${prefix}/${step.id}` : step.id
    if (step.type === 'text') {
      flat.push({
        key: stepKey,
        label: step.text,
        depth,
        kind: 'text',
      })
    } else {
      const nested = templates.find((r) => r.id === step.routineId)
      flat.push({
        key: stepKey,
        label: nested?.name ?? '(missing routine)',
        depth,
        kind: 'nested-header',
        routineId: step.routineId,
      })
      flat.push(
        ...flattenRoutineSteps(step.routineId, templates, stepKey, depth + 1, nextVisited)
      )
    }
  }

  return flat
}

export function wouldCreateRoutineCycle(
  parentRoutineId: string,
  nestedRoutineId: string,
  templates: RoutineTemplate[]
): boolean {
  if (parentRoutineId === nestedRoutineId) return true

  const visited = new Set<string>()
  const stack = [nestedRoutineId]

  while (stack.length > 0) {
    const id = stack.pop()!
    if (id === parentRoutineId) return true
    if (visited.has(id)) continue
    visited.add(id)
    const routine = templates.find((r) => r.id === id)
    if (!routine) continue
    for (const step of routine.steps) {
      if (step.type === 'routine') stack.push(step.routineId)
    }
  }

  return false
}

export function routinesReferencing(
  routineId: string,
  templates: RoutineTemplate[]
): RoutineTemplate[] {
  return templates.filter((r) =>
    r.steps.some((s) => s.type === 'routine' && s.routineId === routineId)
  )
}
