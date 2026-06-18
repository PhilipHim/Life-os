'use client'

import { useState, useMemo, useCallback } from 'react'
import type { WorkItem } from '@/lib/types'
import { useWorkItems } from '@/lib/WorkItemContext'
import { updateWorkItem } from '@/lib/db/work-items'
import { generateTodayInstances, toggleRecurringCompletion } from '@/lib/recurring'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import DetailsPanel from '@/components/DetailsPanel'
import AddToPlanFlow from '@/components/AddToPlanFlow'
import { useDailyPlan } from '@/lib/DailyPlanContext'

type ViewMode = 'all' | 'active' | 'completed'

export default function WorkPage() {
  const {
    workItems, addWorkItem, addRecurringWorkItem, toggleWorkItem, deleteWorkItem,
    restoreWorkItem, permanentDeleteWorkItem, deleteAllCompleted,
    getChildren, addChildToGroup, removeChildFromGroup, unassignedSingles,
    createGroupWithChildren, recurringTemplates,
  } = useWorkItems()
  const { todayPlan } = useDailyPlan()

  const [mode, setMode] = useState<'single' | 'group'>('single')
  const [input, setInput] = useState('')
  const [singleDescription, setSingleDescription] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [childInput, setChildInput] = useState('')
  const [taskRows, setTaskRows] = useState<{ id: string; title: string; description: string }[]>([
    { id: crypto.randomUUID(), title: '', description: '' },
  ])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [addingExistingTo, setAddingExistingTo] = useState<string | null>(null)
  const [existingSearch, setExistingSearch] = useState('')
  const [panelItem, setPanelItem] = useState<WorkItem | null>(null)
  const [planTargetItem, setPlanTargetItem] = useState<{ id: string; title: string } | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewFilter, setViewFilter] = useState<ViewMode>('all')
  const [recurringEnabled, setRecurringEnabled] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly'>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
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

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    if (recurringEnabled) {
      addRecurringWorkItem(title, singleDescription.trim(), recurrenceType, recurrenceType === 'weekly' ? selectedDays : undefined)
    } else {
      addWorkItem(title, 'single', singleDescription.trim() || undefined)
    }
    setInput('')
    setSingleDescription('')
    setRecurringEnabled(false)
    setRecurrenceType('daily')
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
    createGroupWithChildren(title, groupDescription.trim(), children)
    setGroupTitle('')
    setGroupDescription('')
    setTaskRows([{ id: crypto.randomUUID(), title: '', description: '' }])
  }

  const handleAddChild = (groupId: string) => {
    const title = childInput.trim()
    if (!title) return
    addWorkItem(title, 'single', undefined)
    const fresh = JSON.parse(localStorage.getItem('productivity_work_items') || '[]') as WorkItem[]
    const child = fresh.find((i) => i.title === title && !i.parentId && !i.isTemplate)
    if (child) addChildToGroup(groupId, child.id)
    setChildInput('')
  }

  const handleUpdate = (updated: WorkItem) => {
    updateWorkItem(updated)
    setPanelItem(null)
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredExisting = useMemo(() => {
    return unassignedSingles.filter((s) =>
      s.title.toLowerCase().includes(existingSearch.toLowerCase())
    )
  }, [unassignedSingles, existingSearch])

  const deletedItems = workItems.filter((i) => i.status === 'deleted')

  const standaloneItems = useMemo(() => {
    return workItems.filter((i) => i.status !== 'deleted' && i.type === 'single' && !i.parentId && !i.isTemplate).filter((i) => {
      const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesView =
        viewFilter === 'all' ||
        (viewFilter === 'active' && i.status === 'active') ||
        (viewFilter === 'completed' && i.status === 'completed')
      return matchesSearch && matchesView
    })
  }, [workItems, searchQuery, viewFilter])

  const groupItemsList = useMemo(() => {
    return workItems.filter((i) => i.status !== 'deleted' && i.type === 'group').filter((i) => {
      const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesView =
        viewFilter === 'all' ||
        (viewFilter === 'active' && i.status === 'active') ||
        (viewFilter === 'completed' && i.status === 'completed')
      return matchesSearch && matchesView
    })
  }, [workItems, searchQuery, viewFilter])

  const plannedIds = useMemo(() => new Set(todayPlan.map((p) => p.workItemId)), [todayPlan])

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight">Work Items</h1>

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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recurringEnabled}
                onChange={(e) => setRecurringEnabled(e.target.checked)}
                className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Recurring Task</span>
            </label>
            {recurringEnabled && (
              <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecurrenceType('daily')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      recurrenceType === 'daily'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurrenceType('weekly')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      recurrenceType === 'weekly'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
                {recurrenceType === 'weekly' && (
                  <div className="flex gap-1">
                    {[
                      { value: 0, label: 'S' },
                      { value: 1, label: 'M' },
                      { value: 2, label: 'T' },
                      { value: 3, label: 'W' },
                      { value: 4, label: 'T' },
                      { value: 5, label: 'F' },
                      { value: 6, label: 'S' },
                    ].map((day) => {
                      const isSelected = selectedDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            setSelectedDays((prev) =>
                              isSelected ? prev.filter((d) => d !== day.value) : [...prev, day.value]
                            )
                          }}
                          className={`size-8 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-gray-900 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <Button type="submit">Add</Button>
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
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Tasks</p>
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
            <Button type="submit">Create Group</Button>
          </form>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setViewFilter(f)}
              className={
                viewFilter === f
                  ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm'
                  : 'rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'}
            </button>
          ))}
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
            <h2 className="text-lg font-semibold text-gray-900">Today's Recurring</h2>
            {todayRecurringInstances
              .filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
              <Card key={item.id} className="transition-all hover:border-gray-300 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={item.status === 'completed'}
                    onChange={() => handleToggleRecurringInstance(item.templateId)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Recurring</span>
                      <p className={`text-sm ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {item.title}
                      </p>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPlanTargetItem({ id: item.templateId, title: item.title })} className={plannedIds.has(item.templateId) ? 'text-green-600' : ''}>Plan</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {standaloneItems.length === 0 && groupItemsList.length === 0 && todayRecurringInstances.length === 0 && (
          <Card><p className="text-center text-sm text-gray-400 py-6">No items found.</p></Card>
        )}

        {recurringTemplates.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Recurring Templates</h2>
            {recurringTemplates
              .filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
              <Card key={item.id} className="transition-all hover:border-gray-300 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="size-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Recurring</span>
                      {item.recurrenceType === 'weekly' && item.daysOfWeek && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, i) => item.daysOfWeek!.includes(i)).join(',')}
                        </span>
                      )}
                      {item.recurrenceType === 'daily' && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Daily</span>
                      )}
                      <p className="text-sm text-gray-900">{item.title}</p>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPanelItem(item)}>Details</Button>
                    <Button variant="ghost" size="sm" onClick={() => setPlanTargetItem({ id: item.id, title: item.title })} className={plannedIds.has(item.id) ? 'text-green-600' : ''}>Plan</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteWorkItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {standaloneItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Individual Items</h2>
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
                    <Button variant="ghost" size="sm" onClick={() => deleteWorkItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {groupItemsList.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
            {groupItemsList.map((item) => {
              const children = getChildren(item.id)
              const doneChildren = children.filter((c) => c.status === 'completed').length
              const progress = children.length > 0 ? Math.round((doneChildren / children.length) * 100) : 0
              const isExpanded = expandedGroups.has(item.id)

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
                          <Button variant="ghost" size="sm" onClick={() => deleteWorkItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">Delete</Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {isExpanded && (
                    <div className="ml-8 space-y-2 pl-4 border-l-2 border-gray-100">
                      <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                        Items inside this group
                      </p>

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
                                className="text-orange-400 hover:text-orange-600 hover:bg-orange-50"
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
                          value={childInput}
                          onChange={(e) => setChildInput(e.target.value)}
                          placeholder="Create new item..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddChild(item.id)
                            }
                          }}
                          className="min-h-[36px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                        />
                        <Button size="sm" onClick={() => handleAddChild(item.id)}>Create</Button>
                      </div>

                      <div>
                        <button
                          onClick={() => setAddingExistingTo(addingExistingTo === item.id ? null : item.id)}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {addingExistingTo === item.id ? 'Cancel' : '+ Add existing item'}
                        </button>

                        {addingExistingTo === item.id && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={existingSearch}
                              onChange={(e) => setExistingSearch(e.target.value)}
                              placeholder="Search singles..."
                              className="min-h-[36px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {filteredExisting.length === 0 && (
                                <p className="text-xs text-gray-400 py-2">No unassigned singles found.</p>
                              )}
                              {filteredExisting.map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                                  <span className="text-sm text-gray-900">{s.title}</span>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      addChildToGroup(item.id, s.id)
                                      setExistingSearch('')
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
          <button
            onClick={() => setShowDeleted((prev) => !prev)}
            className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <span className="font-medium">Deleted ({deletedItems.length})</span>
            <svg
              className={`size-4 transition-transform ${showDeleted ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDeleted && (
            <div className="space-y-3">
              {deletedItems.map((item) => (
                <Card key={item.id} className="opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'group' && (
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">GROUP</span>
                      )}
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => restoreWorkItem(item.id)}>Restore</Button>
                      <Button variant="ghost" size="sm" onClick={() => permanentDeleteWorkItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">Permanently Delete</Button>
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
