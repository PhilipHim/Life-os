'use client'

import { useState, useEffect } from 'react'
import type { WorkItem } from '@/lib/types'
import { getWorkItems } from '@/lib/db/work-items'
import { useFocus } from '@/lib/FocusContext'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'

interface DetailsPanelProps {
  isOpen: boolean
  onClose: () => void
  entity: WorkItem
  onUpdate: (updated: WorkItem) => void
}

function calcProgress(entity: WorkItem): number {
  if (entity.type === 'single') return entity.status === 'completed' ? 100 : 0
  const allItems = getWorkItems()
  const children = entity.childrenIds.map((id) => allItems.find((i) => i.id === id)).filter(Boolean) as WorkItem[]
  if (children.length === 0) return 0
  return Math.round((children.filter((c) => c.status === 'completed').length / children.length) * 100)
}

export default function DetailsPanel({ isOpen, onClose, entity, onUpdate }: DetailsPanelProps) {
  const { startFocus } = useFocus()
  const [title, setTitle] = useState(entity.title)
  const [description, setDescription] = useState(entity.description)
  const [notes, setNotes] = useState(entity.notes)
  const [children, setChildren] = useState<WorkItem[]>([])
  const [parent, setParent] = useState<WorkItem | undefined>(undefined)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setTitle(entity.title)
    setDescription(entity.description)
    setNotes(entity.notes)
    setProgress(calcProgress(entity))

    if (entity.type === 'group') {
      const allItems = getWorkItems()
      setChildren(entity.childrenIds.map((id) => allItems.find((i) => i.id === id)).filter(Boolean) as WorkItem[])
      setParent(undefined)
    } else {
      const allItems = getWorkItems()
      setParent(allItems.find((i) => i.childrenIds.includes(entity.id)))
      setChildren([])
    }
  }, [entity])

  const handleSave = () => {
    onUpdate({ ...entity, title: title.trim() || entity.title, description, notes })
  }

  const handleToggleComplete = () => {
    onUpdate({ ...entity, status: entity.status === 'completed' ? 'active' : 'completed' })
  }

  if (!isOpen) return null

  const label = entity.type === 'group' ? 'Group' : 'Single'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-xl border-l border-gray-200 animate-slide-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">{label}</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Checkbox checked={entity.status === 'completed'} onChange={handleToggleComplete} />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-400">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-400">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add notes..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white"
            />
          </div>

          {entity.type === 'group' && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">{progress}%</span>
              </div>
            </div>
          )}

          {entity.type === 'group' && (
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => {
                onClose()
                startFocus(entity.id, entity.title)
              }}
            >
              Start Focus Session
            </Button>
          )}

          {entity.type === 'group' && children.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">Children ({children.length})</p>
              <div className="space-y-1">
                {children.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={c.status === 'completed' ? 'text-gray-400 line-through' : ''}>{c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entity.type === 'single' && parent && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">Parent Group</p>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {parent.title}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Created {new Date(entity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
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
