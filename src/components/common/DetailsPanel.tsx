'use client'

import { useState, useEffect } from 'react'
import type { WorkItem, Project, Task } from '@/types'
import { getPlannerDefaults, setPlannerDefaults, type PlannerTaskDefaults } from '@/features/planner/lib/planner-defaults'
import { useWorkItems } from '@/contexts/WorkItemContext'
import { localDateStr } from '@/utils/date'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'

const PRIORITY_OPTIONS: Task['priority'][] = ['H1', 'H2', 'M', 'L']

type DetailsPanelProps =
  | {
      isOpen: boolean
      onClose: () => void
      type?: 'work'
      entity: WorkItem
      onUpdate: (updated: WorkItem) => void
    }
  | {
      isOpen: boolean
      onClose: () => void
      type: 'project'
      entity: Project
      onUpdate: (updated: Project | Task) => void
    }
  | {
      isOpen: boolean
      onClose: () => void
      type: 'task'
      entity: Task
      onUpdate: (updated: Project | Task) => void
    }

function calcProgress(entity: WorkItem, children: WorkItem[]): number {
  if (entity.type === 'single') return entity.status === 'completed' ? 100 : 0
  if (children.length === 0) return 0
  return Math.round((children.filter((c) => c.status === 'completed').length / children.length) * 100)
}

function PriorityDurationFields({
  priority,
  duration,
  onPriorityChange,
  onDurationChange,
}: {
  priority: Task['priority']
  duration: string
  onPriorityChange: (value: Task['priority']) => void
  onDurationChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="mb-1 los-section-label">Priority</p>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as Task['priority'])}
          className="w-full rounded-lg border border-los-border bg-gray-50 px-3 py-2 text-sm text-los-text-primary focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="mb-1 los-section-label">Duration (min)</p>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
          className="w-full rounded-lg border border-los-border bg-gray-50 px-3 py-2 text-sm text-los-text-primary focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
        />
      </div>
    </div>
  )
}

function SimpleDetailsPanel({
  isOpen,
  onClose,
  label,
  entity,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  label: string
  entity: Project | Task
  onUpdate: (updated: Project | Task) => void
}) {
  const isTaskEntity = 'recurring' in entity
  const [title, setTitle] = useState(entity.title)
  const [description, setDescription] = useState(entity.description)
  const [notes, setNotes] = useState(entity.notes)
  const [priority, setPriority] = useState<Task['priority']>(
    isTaskEntity ? (entity as Task).priority ?? 'M' : 'M'
  )
  const [duration, setDuration] = useState(
    String(isTaskEntity ? (entity as Task).estimatedDuration ?? 30 : 30)
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTitle(entity.title)
    setDescription(entity.description)
    setNotes(entity.notes)
    if ('recurring' in entity) {
      setPriority(entity.priority ?? 'M')
      setDuration(String(entity.estimatedDuration ?? 30))
    }
  }, [entity])

  const handleSave = () => {
    if ('recurring' in entity) {
      onUpdate({
        ...entity,
        title: title.trim() || entity.title,
        description,
        notes,
        priority,
        estimatedDuration: parseInt(duration, 10) || 30,
      })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
      return
    }
    onUpdate({ ...entity, title: title.trim() || entity.title, description, notes })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const handleToggleComplete = () => {
    if (isTaskEntity) {
      const task = entity as Task
      if (task.recurring !== 'none') {
        const now = Date.now()
        const doneToday =
          task.completed &&
          task.completedAt &&
          localDateStr(new Date(task.completedAt)) === localDateStr()
        if (doneToday) {
          onUpdate({ ...task, completed: false, completedAt: null })
        } else {
          onUpdate({ ...task, completed: true, completedAt: now })
        }
        return
      }
    }
    onUpdate({ ...entity, completed: !entity.completed })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-los-bg-card shadow-xl border-l border-los-border animate-slide-in pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-los-border-subtle px-4 py-4 sm:px-6">
          <span className="los-section-label">{label}</span>
          <button onClick={onClose} aria-label="Close panel" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-los-text-muted hover:bg-los-bg-secondary hover:text-los-text-primary transition-colors sm:min-h-0 sm:min-w-0 sm:p-1.5">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 sm:px-6">
          <div className="flex items-center gap-4">
            <Checkbox checked={entity.completed} onChange={handleToggleComplete} />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-xl font-semibold text-los-text-primary bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            />
          </div>

          <div>
            <p className="mb-1 los-section-label">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-los-border bg-gray-50 px-3 py-2 text-sm text-los-text-primary placeholder:text-los-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <p className="mb-1 los-section-label">Details</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add details..."
              className="w-full rounded-lg border border-los-border bg-gray-50 px-3 py-2 text-sm text-los-text-primary placeholder:text-los-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
            />
          </div>

          {isTaskEntity && (
            <PriorityDurationFields
              priority={priority}
              duration={duration}
              onPriorityChange={setPriority}
              onDurationChange={setDuration}
            />
          )}

          <p className="text-xs text-los-text-muted">
            Created {new Date(entity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="border-t border-los-border-subtle px-6 py-4 space-y-2">
          {saved && <p className="text-center text-xs text-green-600">Changes saved</p>}
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

function WorkItemDetailsPanel({
  isOpen,
  onClose,
  entity,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  entity: WorkItem
  onUpdate: (updated: WorkItem) => void
}) {
  const { workItems, getChildren } = useWorkItems()
  const [title, setTitle] = useState(entity.title)
  const [description, setDescription] = useState(entity.description)
  const [notes, setNotes] = useState(entity.notes)
  const [priority, setPriority] = useState<PlannerTaskDefaults['priority']>('M')
  const [duration, setDuration] = useState('30')
  const [children, setChildren] = useState<WorkItem[]>([])
  const [parent, setParent] = useState<WorkItem | undefined>(undefined)
  const [progress, setProgress] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTitle(entity.title)
    setDescription(entity.description)
    setNotes(entity.notes)
    const defaults = getPlannerDefaults(entity.id)
    setPriority(defaults.priority)
    setDuration(String(defaults.estimatedDuration))
  }, [entity])

  useEffect(() => {
    if (entity.type === 'group') {
      const groupChildren = getChildren(entity.id)
      setChildren(groupChildren)
      setProgress(calcProgress(entity, groupChildren))
      setParent(undefined)
    } else {
      setParent(workItems.find((i) => i.childrenIds.includes(entity.id)))
      setChildren([])
      setProgress(entity.status === 'completed' ? 100 : 0)
    }
  }, [entity.id, entity.type, entity.status, workItems, getChildren])

  const handleSave = () => {
    onUpdate({ ...entity, title: title.trim() || entity.title, description, notes })
    setPlannerDefaults(entity.id, {
      priority,
      estimatedDuration: parseInt(duration, 10) || 30,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const handleToggleComplete = () => {
    onUpdate({ ...entity, status: entity.status === 'completed' ? 'active' : 'completed' })
  }

  if (!isOpen) return null

  const label = entity.type === 'group' ? 'Group' : 'Single'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-los-bg-card shadow-xl border-l border-los-border animate-slide-in pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-los-border-subtle px-4 py-4 sm:px-6">
          <span className="los-section-label">{label}</span>
          <button onClick={onClose} aria-label="Close panel" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-los-text-muted hover:bg-los-bg-secondary hover:text-los-text-primary transition-colors sm:min-h-0 sm:min-w-0 sm:p-1.5">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 sm:px-6">
          <div className="flex items-center gap-4">
            <Checkbox checked={entity.status === 'completed'} onChange={handleToggleComplete} />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-xl font-semibold text-los-text-primary bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            />
          </div>

          <div>
            <p className="mb-1 los-section-label">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-los-border bg-gray-50 px-3 py-2 text-sm text-los-text-primary placeholder:text-los-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <p className="mb-1 los-section-label">Details</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add details..."
              className="w-full rounded-lg border border-los-border bg-gray-50 px-3 py-2 text-sm text-los-text-primary placeholder:text-los-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
            />
          </div>

          <PriorityDurationFields
            priority={priority}
            duration={duration}
            onPriorityChange={setPriority}
            onDurationChange={setDuration}
          />

          {entity.type === 'group' && (
            <div>
              <p className="mb-2 los-section-label">Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-los-text-primary w-10 text-right">{progress}%</span>
              </div>
            </div>
          )}

          {entity.type === 'group' && children.length > 0 && (
            <div>
              <p className="mb-2 los-section-label">Tasks ({children.length})</p>
              <div className="space-y-1">
                {children.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-los-text-secondary">
                    <span className="text-los-text-muted">•</span>
                    <span className={c.status === 'completed' ? 'text-los-text-muted line-through' : ''}>{c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entity.type === 'single' && parent && (
            <div>
              <p className="mb-2 los-section-label">Parent Group</p>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-los-text-secondary">
                {parent.title}
              </span>
            </div>
          )}

          <p className="text-xs text-los-text-muted">
            Created {new Date(entity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="border-t border-los-border-subtle px-6 py-4 space-y-2">
          {saved && <p className="text-center text-xs text-green-600">Changes saved</p>}
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

export default function DetailsPanel(props: DetailsPanelProps) {
  if (props.type === 'project') {
    return <SimpleDetailsPanel {...props} label="Project" />
  }
  if (props.type === 'task') {
    return <SimpleDetailsPanel {...props} label="Task" />
  }
  return <WorkItemDetailsPanel {...props} />
}
