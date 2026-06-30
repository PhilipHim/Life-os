'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { WorkItem } from '@/lib/types'
import { useWorkItems } from '@/lib/WorkItemContext'
import {
  generateTodayInstances,
  toggleRecurringCompletion,
  skipRecurringToday,
  unskipRecurringToday,
  computeRecurringTemplateStats,
} from '@/lib/recurring'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import DetailsPanel from '@/components/DetailsPanel'
import AddToPlanFlow from '@/components/AddToPlanFlow'
import { useDailyPlan } from '@/lib/DailyPlanContext'

type ViewMode = 'active' | 'completed' | 'all'

const CHILD_PREVIEW_LIMIT = 3
const DELETE_BTN = 'text-red-500 hover:text-red-600 hover:bg-red-50'

function listEmptyMessage(viewFilter: ViewMode, searchQuery: string): string {
  if (searchQuery.trim()) return 'No tasks match your search.'
  if (viewFilter === 'active') return 'No open tasks.'
  if (viewFilter === 'completed') return 'No completed tasks.'
  return 'No tasks yet. Create one above.'
}

function groupChildPreviewLines(children: WorkItem[]): string[] {
  if (children.length === 0) return []
  if (children.length <= CHILD_PREVIEW_LIMIT) {
    return children.map((c) => c.title)
  }
  const lines = children.slice(0, CHILD_PREVIEW_LIMIT).map((c) => c.title)
  lines[CHILD_PREVIEW_LIMIT - 1] = `${lines[CHILD_PREVIEW_LIMIT - 1]}...`
  return lines
}

function activeUnassignedSingles(items: WorkItem[]): WorkItem[] {
  return items.filter((i) => i.status === 'active')
}

export default function WorkPage() {
  const {
    workItems, toggleWorkItem, deleteWorkItem, deleteRecurringTemplate,
    restoreWorkItem, permanentDeleteWorkItem, deleteAllCompleted, emptyTrash,
    updateWorkItem,
    getChildren, addChildToGroup, removeChildFromGroup, unassignedSingles,
    createGroupWithChildren, createSingleWorkItem, recurringTemplates,
  } = useWorkItems()
  const { todayPlan } = useDailyPlan()

  const [mode, setMode] = useState<'single' | 'group'>('single')
  const [input, setInput] = useState('')
  const [singleDescription, setSingleDescription] = useState('')
  const [singleDetails, setSingleDetails] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [childInputs, setChildInputs] = useState<Record<string, string>>({})
  const [existingSearches, setExistingSearches] = useState<Record<string, string>>({})
  const [taskRows, setTaskRows] = useState<{ id: string; title: string; description: string }[]>([
    { id: crypto.randomUUID(), title: '', description: '' },
  ])
  const [groupExistingSearch, setGroupExistingSearch] = useState('')
  const [selectedExistingIds, setSelectedExistingIds] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [addingExistingTo, setAddingExistingTo] = useState<string | null>(null)
  const [panelItem, setPanelItem] = useState<WorkItem | null>(null)
  const [planTargetItem, setPlanTargetItem] = useState<{ id: string; title: string } | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewFilter, setViewFilter] = useState<ViewMode>('active')
  const [recurringRefreshKey, setRecurringRefreshKey] = useState(0)

  const todayRecurringInstances = useMemo(
    () => generateTodayInstances(recurringTemplates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recurringTemplates, recurringRefreshKey]
  )

  const handleToggleRecurringInstance = useCallback((templateId: string) => {
    toggleRecurringCompletion(templateId)
    setRecurringRefreshKey((k) => k + 1)
  }, [])

  const handleSkipRecurringInstance = useCallback((templateId: string) => {
    skipRecurringToday(templateId)
    setRecurringRefreshKey((k) => k + 1)
  }, [])

  const handleUnskipRecurringInstance = useCallback((templateId: string) => {
    unskipRecurringToday(templateId)
    setRecurringRefreshKey((k) => k + 1)
  }, [])

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    createSingleWorkItem({
      title,
      description: singleDescription.trim(),
      notes: singleDetails.trim(),
    })
    setInput('')
    setSingleDescription('')
    setSingleDetails('')
  }

  const addTaskRow = () => {
    setTaskRows([...taskRows, { id: crypto.randomUUID(), title: '', description: '' }])
  }

  const removeTaskRow = (id: string) => {
    if (taskRows.length > 1) {
      setTaskRows(taskRows.filter((r) => r.id !== id))
    }
  }

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = groupTitle.trim()
    if (!title) return
    const children = taskRows.filter((r) => r.title.trim()).map((r) => ({
      title: r.title.trim(),
      description: r.description.trim() || undefined,
    }))
    createGroupWithChildren(title, groupDescription.trim(), children, [...selectedExistingIds])
    setGroupTitle('')
    setGroupDescription('')
    setTaskRows([{ id: crypto.randomUUID(), title: '', description: '' }])
    setGroupExistingSearch('')
    setSelectedExistingIds(new Set())
  }

  const toggleGroupExistingSelection = (id: string) => {
    setSelectedExistingIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddChild = (groupId: string) => {
    const title = (childInputs[groupId] ?? '').trim()
    if (!title) return
    const childId = createSingleWorkItem({ title, description: '', notes: '' })
    addChildToGroup(groupId, childId)
    setChildInputs((prev) => ({ ...prev, [groupId]: '' }))
  }

  const handleUpdate = (updated: WorkItem) => {
    updateWorkItem(updated)
    setPanelItem(updated)
  }

  useEffect(() => {
    if (!panelItem) return
    const fresh = workItems.find((i) => i.id === panelItem.id)
    if (fresh && fresh.updatedAt !== panelItem.updatedAt) setPanelItem(fresh)
  }, [workItems, panelItem])

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getExistingSearch = (groupId: string) => existingSearches[groupId] ?? ''

  const filteredExistingForGroup = useCallback(
    (groupId: string) => {
      const q = getExistingSearch(groupId).toLowerCase()
      return activeUnassignedSingles(unassignedSingles).filter((s) => s.title.toLowerCase().includes(q))
    },
    [unassignedSingles, existingSearches]
  )

  const selectableForGroup = useMemo(() => {
    return activeUnassignedSingles(unassignedSingles).filter((s) =>
      s.title.toLowerCase().includes(groupExistingSearch.toLowerCase())
    )
  }, [unassignedSingles, groupExistingSearch])

  const deletedItems = workItems.filter((i) => i.status === 'deleted')

  const matchesSearch = useCallback(
    (item: WorkItem) => item.title.toLowerCase().includes(searchQuery.toLowerCase()),
    [searchQuery]
  )

  const isListItem = (item: WorkItem) =>
    item.status !== 'deleted' && !item.isTemplate && (item.type === 'single' ? !item.parentId : true)

  const standaloneItems = useMemo(() => {
    return workItems
      .filter((i) => isListItem(i) && i.type === 'single')
      .filter((i) => {
        const matchesView =
          viewFilter === 'all' ||
          (viewFilter === 'active' && i.status === 'active') ||
          (viewFilter === 'completed' && i.status === 'completed')
        return matchesSearch(i) && matchesView
      })
  }, [workItems, matchesSearch, viewFilter])

  const groupItemsList = useMemo(() => {
    return workItems
      .filter((i) => isListItem(i) && i.type === 'group')
      .filter((i) => {
        const matchesView =
          viewFilter === 'all' ||
          (viewFilter === 'active' && i.status === 'active') ||
          (viewFilter === 'completed' && i.status === 'completed')
        return matchesSearch(i) && matchesView
      })
  }, [workItems, matchesSearch, viewFilter])

  const completedCount = useMemo(
    () => workItems.filter((i) => isListItem(i) && i.status === 'completed').length,
    [workItems]
  )

  const handleDeleteAllCompleted = () => {
    if (!window.confirm('Delete all completed tasks? This cannot be undone.')) return
    deleteAllCompleted()
    if (viewFilter === 'completed') setViewFilter('active')
  }

  const handleEmptyTrash = () => {
    if (!window.confirm('Permanently delete all items in trash? This cannot be undone.')) return
    emptyTrash()
  }

  const plannedIds = useMemo(() => new Set(todayPlan.map((p) => p.workItemId)), [todayPlan])

  const showListEmpty = standaloneItems.length === 0 && groupItemsList.length === 0
  const listEmpty = listEmptyMessage(viewFilter, searchQuery)

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>

      <Card>
        <div className="flex gap-1 mb-6">
          <Button
            variant={mode === 'single' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('single')}
          >
            Single
          </Button>
          <Button
            variant={mode === 'group' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('group')}
          >
            Group
          </Button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Title..."
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
            <textarea
              value={singleDescription}
              onChange={(e) => setSingleDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
            <textarea
              value={singleDetails}
              onChange={(e) => setSingleDetails(e.target.value)}
              placeholder="Details (optional)..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
            <Button type="submit">Add Task</Button>
          </form>
        ) : (
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Group title..."
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Create New Tasks</p>
              {taskRows.map((row, idx) => (
                <div key={row.id} className="flex items-start gap-2">
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => {
                      const next = [...taskRows]
                      next[idx] = { ...next[idx], title: e.target.value }
                      setTaskRows(next)
                    }}
                    placeholder="Task title..."
                    className="min-h-[36px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                  />
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => {
                      const next = [...taskRows]
                      next[idx] = { ...next[idx], description: e.target.value }
                      setTaskRows(next)
                    }}
                    placeholder="Description (optional)"
                    className="min-h-[36px] hidden sm:block w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                  />
                  {taskRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTaskRow(row.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTaskRow}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                + Add another task
              </button>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Select Existing Tasks</p>
                {selectedExistingIds.size > 0 && (
                  <span className="text-xs text-gray-500">{selectedExistingIds.size} selected</span>
                )}
              </div>
              <input
                type="text"
                value={groupExistingSearch}
                onChange={(e) => setGroupExistingSearch(e.target.value)}
                placeholder="Search active tasks..."
                className="min-h-[36px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
              />
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {selectableForGroup.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-gray-400">No active unassigned tasks found.</p>
                )}
                {selectableForGroup.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExistingIds.has(task.id)}
                      onChange={() => toggleGroupExistingSelection(task.id)}
                      className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-900">{task.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit">Create Group</Button>
          </form>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setViewFilter(f)}
              className={
                viewFilter === f
                  ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm'
                  : 'rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }
            >
              {f === 'active' ? 'Open Tasks' : f === 'completed' ? 'Completed Tasks' : 'All Tasks'}
            </button>
          ))}
          {viewFilter === 'completed' && completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAllCompleted}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Delete All Completed
            </Button>
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="min-h-[40px] max-w-xs rounded-lg border border-gray-300 bg-white px-4 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
        />
      </div>

      <div className="space-y-8">
        {todayRecurringInstances.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Today&apos;s Recurring</p>
            {todayRecurringInstances
              .filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => {
              const stats = computeRecurringTemplateStats(
                recurringTemplates.find((t) => t.id === item.templateId)!
              )
              const isSkipped = item.instanceStatus === 'skipped'
              const isDone = item.instanceStatus === 'completed'
              return (
              <Card key={item.id} className={`transition-all hover:border-gray-300 hover:shadow-md ${isSkipped ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={isDone}
                    disabled={isSkipped}
                    onChange={() => handleToggleRecurringInstance(item.templateId)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        {item.recurrenceType === 'weekly' ? 'Weekly' : 'Daily'}
                      </span>
                      {isSkipped && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Skipped</span>
                      )}
                      <p className={`text-sm ${isDone ? 'text-gray-400 line-through' : isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
                        {item.title}
                      </p>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{stats.streak} day streak</span>
                      <span>·</span>
                      <span>{stats.weeklyCompletionPct}% this week</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPlanTargetItem({ id: item.templateId, title: item.title })} className={plannedIds.has(item.templateId) ? 'text-green-600' : ''}>Plan</Button>
                    {isSkipped ? (
                      <Button variant="ghost" size="sm" onClick={() => handleUnskipRecurringInstance(item.templateId)}>Undo Skip</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleSkipRecurringInstance(item.templateId)}>Skip</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteRecurringTemplate(item.templateId)} className={DELETE_BTN}>Delete</Button>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        )}

        {showListEmpty && (
          <Card><p className="text-center text-sm text-gray-400 py-6">{listEmpty}</p></Card>
        )}

        {standaloneItems.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Tasks</p>
            {standaloneItems.map((item) => (
              <Card key={item.id} className="transition-all hover:border-gray-300 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={item.status === 'completed'}
                    onChange={() => toggleWorkItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPanelItem(item)}>Details</Button>
                    <Button variant="ghost" size="sm" onClick={() => setPlanTargetItem({ id: item.id, title: item.title })} className={plannedIds.has(item.id) ? 'text-green-600' : ''}>Plan</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteWorkItem(item.id)} className={DELETE_BTN}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {groupItemsList.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Groups</p>
            {groupItemsList.map((item) => {
              const children = getChildren(item.id)
              const doneChildren = children.filter((c) => c.status === 'completed').length
              const progress = children.length > 0 ? Math.round((doneChildren / children.length) * 100) : 0
              const isExpanded = expandedGroups.has(item.id)
              const previewLines = groupChildPreviewLines(children)

              return (
                <div key={item.id} className="space-y-2">
                  <Card className="transition-all hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={item.status === 'completed'}
                        onChange={() => toggleWorkItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                              GROUP
                            </span>
                            <p className={item.status === 'completed' ? 'font-semibold text-gray-400 line-through' : 'font-semibold text-gray-900'}>
                              {item.title}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleGroup(item.id)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <svg
                              className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        {previewLines.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {previewLines.map((line, idx) => (
                              <li key={idx} className="text-xs text-gray-500 truncate pl-0.5">
                                <span className="text-gray-400 mr-1.5">•</span>
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gray-900 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{doneChildren}/{children.length}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="ghost" size="sm" onClick={() => setPanelItem(item)}>Details</Button>
                          <Button variant="ghost" size="sm" onClick={() => setPlanTargetItem({ id: item.id, title: item.title })} className={plannedIds.has(item.id) ? 'text-green-600' : ''}>Plan</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteWorkItem(item.id)} className={DELETE_BTN}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {isExpanded && (
                    <div className="ml-8 space-y-2 pl-4 border-l-2 border-gray-100">
                      <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                        Tasks in group
                      </p>

                      {children.length === 0 && (
                        <p className="text-xs text-gray-400 py-1">No tasks in this group yet.</p>
                      )}

                      {children.map((child) => (
                        <Card key={child.id} className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={child.status === 'completed'}
                              onChange={() => toggleWorkItem(child.id)}
                            />
                            <span className={`flex-1 text-sm ${child.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {child.title}
                            </span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setPanelItem(child)}>Details</Button>
                              <Button variant="ghost" size="sm" onClick={() => setPlanTargetItem({ id: child.id, title: child.title })} className={plannedIds.has(child.id) ? 'text-green-600' : ''}>Plan</Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeChildFromGroup(item.id, child.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={childInputs[item.id] ?? ''}
                          onChange={(e) => setChildInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="New task title..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddChild(item.id)
                            }
                          }}
                          className="min-h-[36px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                        />
                        <Button size="sm" onClick={() => handleAddChild(item.id)}>Add</Button>
                      </div>

                      <div>
                        <button
                          onClick={() => {
                            if (addingExistingTo === item.id) {
                              setAddingExistingTo(null)
                            } else {
                              setAddingExistingTo(item.id)
                              setExistingSearches((prev) => ({ ...prev, [item.id]: '' }))
                            }
                          }}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {addingExistingTo === item.id ? 'Cancel' : '+ Add existing task'}
                        </button>

                        {addingExistingTo === item.id && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={getExistingSearch(item.id)}
                              onChange={(e) => setExistingSearches((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Search active tasks..."
                              className="min-h-[36px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {filteredExistingForGroup(item.id).length === 0 && (
                                <p className="text-xs text-gray-400 py-2">No active unassigned tasks found.</p>
                              )}
                              {filteredExistingForGroup(item.id).map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                                  <span className="text-sm text-gray-900">{s.title}</span>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      addChildToGroup(item.id, s.id)
                                      setExistingSearches((prev) => ({ ...prev, [item.id]: '' }))
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {deletedItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowDeleted((prev) => !prev)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <span className="font-medium">Deleted Tasks ({deletedItems.length})</span>
              <svg
                className={`size-4 transition-transform ${showDeleted ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDeleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEmptyTrash}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Empty Trash
              </Button>
            )}
          </div>
          {showDeleted && (
            <div className="space-y-3">
              {deletedItems.map((item) => (
                <Card key={item.id} className="opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'group' && (
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">GROUP</span>
                      )}
                      <p className="text-sm text-gray-500 line-through">{item.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => restoreWorkItem(item.id)}>Restore</Button>
                      <Button variant="ghost" size="sm" onClick={() => permanentDeleteWorkItem(item.id)} className={DELETE_BTN}>Delete Permanently</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {panelItem && (
        <DetailsPanel
          isOpen
          onClose={() => setPanelItem(null)}
          entity={panelItem}
          onUpdate={handleUpdate}
        />
      )}

      {planTargetItem && (
        <AddToPlanFlow
          workItemId={planTargetItem.id}
          workItemTitle={planTargetItem.title}
          onClose={() => setPlanTargetItem(null)}
        />
      )}
    </div>
  )
}
