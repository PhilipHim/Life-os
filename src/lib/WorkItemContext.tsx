'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { WorkItem } from '@/lib/types'
import {
  getWorkItems,
  addWorkItem as persistAdd,
  addWorkItems as persistAddMany,
  updateWorkItem as persistUpdate,
  updateWorkItems as persistUpdateMany,
  deleteWorkItem as persistDelete,
} from '@/lib/db/work-items'
import { getRecurringTemplates } from '@/lib/recurring'

interface WorkItemContextType {
  workItems: WorkItem[]
  addWorkItem: (title: string, type: 'single' | 'group', description?: string, childrenIds?: string[]) => void
  createSingleWorkItem: (payload: { title: string; description: string; notes: string }) => string
  addRecurringWorkItem: (title: string, description: string, recurrenceType: 'daily' | 'weekly', daysOfWeek?: number[]) => void
  toggleWorkItem: (id: string) => void
  deleteWorkItem: (id: string) => void
  restoreWorkItem: (id: string) => void
  permanentDeleteWorkItem: (id: string) => void
  deleteAllCompleted: () => void
  updateWorkItem: (updated: WorkItem) => void
  createGroupWithChildren: (title: string, description: string, children: { title: string; description?: string }[]) => void
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

export function WorkItemProvider({ children }: { children: ReactNode }) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])

  useEffect(() => {
    setWorkItems(getWorkItems())
  }, [])

  const refresh = useCallback(() => {
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

  const createGroupWithChildren = (title: string, description: string, children: { title: string; description?: string }[]) => {
    const now = Date.now()
    const groupId = crypto.randomUUID()

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
      childrenIds: childItems.map((c) => c.id),
      completedAt: null,
    }

    setWorkItems(persistAddMany([groupItem, ...childItems]))
  }

  const toggleWorkItem = (id: string) => {
    const item = workItems.find((i) => i.id === id)
    if (!item) return
    const now = Date.now()
    if (item.status === 'completed') {
      setWorkItems(persistUpdate({ ...item, status: 'active', completedAt: null, updatedAt: now }))
    } else {
      setWorkItems(persistUpdate({ ...item, status: 'completed', completedAt: now, updatedAt: now }))
    }
  }

  const deleteWorkItem = (id: string) => {
    const item = workItems.find((i) => i.id === id)
    if (!item) return
    setWorkItems(persistUpdate({ ...item, status: 'deleted', updatedAt: Date.now() }))
  }

  const restoreWorkItem = (id: string) => {
    const item = workItems.find((i) => i.id === id)
    if (!item) return
    setWorkItems(persistUpdate({ ...item, status: 'active', updatedAt: Date.now() }))
  }

  const permanentDeleteWorkItem = (id: string) => {
    setWorkItems(persistDelete(id))
  }

  const deleteAllCompleted = () => {
    const remaining = workItems.filter((i) => i.status !== 'completed')
    localStorage.setItem('productivity_work_items', JSON.stringify(remaining))
    refresh()
  }

  const updateWorkItem = (updated: WorkItem) => {
    setWorkItems(persistUpdate({ ...updated, updatedAt: Date.now() }))
  }

  const addChildToGroup = (groupId: string, childId: string) => {
    const group = workItems.find((i) => i.id === groupId)
    const child = workItems.find((i) => i.id === childId)
    if (!group || !child || child.type !== 'single' || group.childrenIds.includes(childId)) return
    const now = Date.now()
    const updatedGroup = { ...group, childrenIds: [...group.childrenIds, childId], updatedAt: now }
    const updatedChild = { ...child, parentId: groupId, updatedAt: now }
    setWorkItems(persistUpdateMany([updatedGroup, updatedChild]))
  }

  const removeChildFromGroup = (groupId: string, childId: string) => {
    const group = workItems.find((i) => i.id === groupId)
    const child = workItems.find((i) => i.id === childId)
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
        restoreWorkItem,
        permanentDeleteWorkItem,
        deleteAllCompleted,
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
