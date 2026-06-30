'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { WorkItem } from '@/lib/types'
import {
  getWorkItems,
  addWorkItem as persistAdd,
  addWorkItems as persistAddMany,
  updateWorkItem as persistUpdate,
  updateWorkItems as persistUpdateMany,
  deleteWorkItem as persistDelete,
  replaceWorkItems,
} from '@/lib/db/work-items'
import { getRecurringTemplates, clearRecurringDataForTemplate } from '@/lib/recurring'
import { removePlannerDefaults } from '@/lib/planner-defaults'
import { removeDailyPlanItemsByWorkItemId } from '@/lib/db/daily-plan'

interface WorkItemContextType {
  workItems: WorkItem[]
  addWorkItem: (title: string, type: 'single' | 'group', description?: string, childrenIds?: string[]) => void
  createSingleWorkItem: (payload: { title: string; description: string; notes: string }) => string
  addRecurringWorkItem: (title: string, description: string, recurrenceType: 'daily' | 'weekly', daysOfWeek?: number[]) => void
  toggleWorkItem: (id: string) => void
  deleteWorkItem: (id: string) => void
  deleteRecurringTemplate: (id: string) => void
  restoreWorkItem: (id: string) => void
  permanentDeleteWorkItem: (id: string) => void
  deleteAllCompleted: () => void
  emptyTrash: () => void
  updateWorkItem: (updated: WorkItem) => void
  createGroupWithChildren: (title: string, description: string, children: { title: string; description?: string }[], existingChildIds?: string[]) => void
  addChildToGroup: (groupId: string, childId: string) => void
  removeChildFromGroup: (groupId: string, childId: string) => void
  getChildren: (parentId: string) => WorkItem[]
  getParent: (childId: string) => WorkItem | undefined
  singleItems: WorkItem[]
  groupItems: WorkItem[]
  unassignedSingles: WorkItem[]
  recurringTemplates: WorkItem[]
}

const WorkItemContext = createContext<WorkItemContextType | null>(null)

function cleanupWorkItemReferences(item: WorkItem | undefined, id: string): void {
  if (item?.isTemplate && item.recurring) {
    clearRecurringDataForTemplate(id)
  }
  removePlannerDefaults(id)
  removeDailyPlanItemsByWorkItemId(id)
}

export function WorkItemProvider({ children }: { children: ReactNode }) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])

  useEffect(() => {
    setWorkItems(getWorkItems())
  }, [])

  const addWorkItem = (title: string, type: 'single' | 'group', description?: string, childrenIds?: string[]) => {
    const now = Date.now()
    const item: WorkItem = {
      id: crypto.randomUUID(),
      type,
      title,
      description: description || '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      childrenIds: type === 'group' ? (childrenIds || []) : [],
      completedAt: null,
    }
    setWorkItems(persistAdd(item))
  }

  const createSingleWorkItem = (payload: { title: string; description: string; notes: string }): string => {
    const now = Date.now()
    const item: WorkItem = {
      id: crypto.randomUUID(),
      type: 'single',
      title: payload.title,
      description: payload.description,
      notes: payload.notes,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      childrenIds: [],
      completedAt: null,
    }
    setWorkItems(persistAdd(item))
    return item.id
  }

  const addRecurringWorkItem = (title: string, description: string, recurrenceType: 'daily' | 'weekly', daysOfWeek?: number[]) => {
    const now = Date.now()
    const item: WorkItem = {
      id: crypto.randomUUID(),
      type: 'single',
      title,
      description: description || '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      childrenIds: [],
      completedAt: null,
      recurring: true,
      recurrenceType,
      daysOfWeek: daysOfWeek || [],
      isTemplate: true,
    }
    setWorkItems(persistAdd(item))
  }

  const createGroupWithChildren = (
    title: string,
    description: string,
    children: { title: string; description?: string }[],
    existingChildIds: string[] = []
  ) => {
    const now = Date.now()
    const groupId = crypto.randomUUID()
    const allItems = getWorkItems()

    const validExisting = existingChildIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(
        (i): i is WorkItem =>
          !!i &&
          i.type === 'single' &&
          i.status === 'active' &&
          !i.parentId &&
          !i.isTemplate
      )

    const childItems: WorkItem[] = children.map((c) => ({
      id: crypto.randomUUID(),
      type: 'single',
      title: c.title,
      description: c.description || '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      childrenIds: [],
      parentId: groupId,
      completedAt: null,
    }))

    const groupItem: WorkItem = {
      id: groupId,
      type: 'group',
      title,
      description: description || '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      childrenIds: [...childItems.map((c) => c.id), ...validExisting.map((c) => c.id)],
      completedAt: null,
    }

    const updatedExisting = validExisting.map((child) => ({
      ...child,
      parentId: groupId,
      updatedAt: now,
    }))

    persistAddMany([groupItem, ...childItems])
    if (updatedExisting.length > 0) persistUpdateMany(updatedExisting)
    setWorkItems(getWorkItems())
  }

  const toggleWorkItem = (id: string) => {
    const item = getWorkItems().find((i) => i.id === id)
    if (!item) return
    const now = Date.now()
    if (item.status === 'completed') {
      setWorkItems(persistUpdate({ ...item, status: 'active', completedAt: null, updatedAt: now }))
    } else {
      setWorkItems(persistUpdate({ ...item, status: 'completed', completedAt: now, updatedAt: now }))
    }
  }

  const deleteRecurringTemplate = (id: string) => {
    const item = getWorkItems().find((i) => i.id === id)
    if (!item) return
    cleanupWorkItemReferences(item, id)
    setWorkItems(persistDelete(id))
  }

  const deleteWorkItem = (id: string) => {
    const all = getWorkItems()
    const item = all.find((i) => i.id === id)
    if (!item) return
    if (item.isTemplate && item.recurring) {
      deleteRecurringTemplate(id)
      return
    }
    const now = Date.now()
    const updates: WorkItem[] = [{ ...item, status: 'deleted', updatedAt: now }]
    if (item.type === 'group') {
      for (const childId of item.childrenIds) {
        const child = all.find((i) => i.id === childId)
        if (child && child.status !== 'deleted') {
          updates.push({ ...child, status: 'deleted', updatedAt: now })
        }
      }
    }
    setWorkItems(persistUpdateMany(updates))
  }

  const restoreWorkItem = (id: string) => {
    const all = getWorkItems()
    const item = all.find((i) => i.id === id)
    if (!item) return
    const now = Date.now()
    const updates: WorkItem[] = [{ ...item, status: 'active', updatedAt: now }]
    if (item.type === 'group') {
      for (const child of all) {
        if (child.parentId === id && child.status === 'deleted') {
          updates.push({ ...child, status: 'active', updatedAt: now })
        }
      }
    }
    setWorkItems(persistUpdateMany(updates))
  }

  const permanentDeleteWorkItem = (id: string) => {
    const all = getWorkItems()
    const item = all.find((i) => i.id === id)
    if (!item) return
    cleanupWorkItemReferences(item, id)
    if (item.type === 'group') {
      for (const childId of item.childrenIds) {
        const child = all.find((i) => i.id === childId)
        if (child) cleanupWorkItemReferences(child, childId)
      }
      setWorkItems(replaceWorkItems(all.filter((i) => i.id !== id && !item.childrenIds.includes(i.id))))
      return
    }
    setWorkItems(persistDelete(id))
  }

  const deleteAllCompleted = () => {
    const current = getWorkItems()
    const completed = current.filter((i) => i.status === 'completed')
    for (const item of completed) {
      cleanupWorkItemReferences(item, item.id)
    }
    setWorkItems(replaceWorkItems(current.filter((i) => i.status !== 'completed')))
  }

  const emptyTrash = () => {
    const current = getWorkItems()
    const deleted = current.filter((i) => i.status === 'deleted')
    for (const item of deleted) {
      cleanupWorkItemReferences(item, item.id)
    }
    setWorkItems(replaceWorkItems(current.filter((i) => i.status !== 'deleted')))
  }

  const updateWorkItem = (updated: WorkItem) => {
    setWorkItems(persistUpdate({ ...updated, updatedAt: Date.now() }))
  }

  const addChildToGroup = (groupId: string, childId: string) => {
    const all = getWorkItems()
    const group = all.find((i) => i.id === groupId)
    const child = all.find((i) => i.id === childId)
    if (!group || !child || child.type !== 'single' || child.status !== 'active' || group.childrenIds.includes(childId)) return
    const now = Date.now()
    const updatedGroup = { ...group, childrenIds: [...group.childrenIds, childId], updatedAt: now }
    const updatedChild = { ...child, parentId: groupId, updatedAt: now }
    setWorkItems(persistUpdateMany([updatedGroup, updatedChild]))
  }

  const removeChildFromGroup = (groupId: string, childId: string) => {
    const all = getWorkItems()
    const group = all.find((i) => i.id === groupId)
    const child = all.find((i) => i.id === childId)
    if (!group || !child) return
    const now = Date.now()
    const updatedGroup = { ...group, childrenIds: group.childrenIds.filter((id) => id !== childId), updatedAt: now }
    const updatedChild = { ...child, parentId: undefined, updatedAt: now }
    setWorkItems(persistUpdateMany([updatedGroup, updatedChild]))
  }

  const getChildren = (parentId: string): WorkItem[] => {
    const parent = workItems.find((i) => i.id === parentId)
    if (!parent) return []
    return parent.childrenIds.map((cid) => workItems.find((i) => i.id === cid)).filter(Boolean) as WorkItem[]
  }

  const getParent = (childId: string): WorkItem | undefined => {
    return workItems.find((i) => i.childrenIds.includes(childId))
  }

  const singleItems = workItems.filter((i) => i.type === 'single' && !i.isTemplate)
  const groupItems = workItems.filter((i) => i.type === 'group')
  const recurringTemplates = getRecurringTemplates(workItems)

  const assignedIds = new Set(workItems.filter((i) => i.type === 'group').flatMap((g) => g.childrenIds))
  const unassignedSingles = workItems.filter(
    (i) => i.type === 'single' && i.status !== 'deleted' && !assignedIds.has(i.id) && !i.parentId && !i.isTemplate
  )

  return (
    <WorkItemContext.Provider
      value={{
        workItems,
        addWorkItem,
        createSingleWorkItem,
        addRecurringWorkItem,
        createGroupWithChildren,
        toggleWorkItem,
        deleteWorkItem,
        deleteRecurringTemplate,
        restoreWorkItem,
        permanentDeleteWorkItem,
        deleteAllCompleted,
        emptyTrash,
        updateWorkItem,
        addChildToGroup,
        removeChildFromGroup,
        getChildren,
        getParent,
        singleItems,
        groupItems,
        unassignedSingles,
        recurringTemplates,
      }}
    >
      {children}
    </WorkItemContext.Provider>
  )
}

export function useWorkItems() {
  const context = useContext(WorkItemContext)
  if (!context) {
    throw new Error('useWorkItems must be used within a WorkItemProvider')
  }
  return context
}
