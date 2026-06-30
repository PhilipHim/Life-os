'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Modal from '@/components/common/Modal'
import { useWorkItems } from '@/contexts/WorkItemContext'
import { useDailyPlan } from '@/contexts/DailyPlanContext'
import type { BusinessIdea } from '@/types'

const priorities = [
  { value: 'H1', label: 'H1', description: 'Critical' },
  { value: 'H2', label: 'H2', description: 'High' },
  { value: 'M', label: 'M', description: 'Medium' },
  { value: 'L', label: 'L', description: 'Low' },
] as const

interface Props {
  idea: BusinessIdea
  onClose: () => void
}

export default function ConvertIdeaToWorkModal({ idea, onClose }: Props) {
  const { createSingleWorkItem } = useWorkItems()
  const { addToPlan } = useDailyPlan()
  const [priority, setPriority] = useState<'H1' | 'H2' | 'M' | 'L'>('M')
  const [estimatedHours, setEstimatedHours] = useState('1')
  const [addToTodayPlan, setAddToTodayPlan] = useState(true)
  const [converted, setConverted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = idea.title.trim() || 'Untitled Idea'
    const workItemId = createSingleWorkItem({
      title,
      description: idea.description,
      notes: idea.notes,
    })

    if (addToTodayPlan) {
      const hours = Math.max(0.25, parseFloat(estimatedHours) || 1)
      const durationMinutes = Math.round(hours * 60)
      addToPlan(workItemId, priority, durationMinutes)
    }

    setConverted(true)
  }

  if (converted) {
    return (
      <Modal title="Work Item Created" onClose={onClose} maxWidth="sm">
        <p className="text-sm text-los-text-secondary">
          &ldquo;{idea.title.trim() || 'Untitled Idea'}&rdquo; is now in your Work area
          {addToTodayPlan ? ' and added to today\u2019s plan' : ''}.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/work" className="flex-1 min-w-[120px]">
            <Button className="w-full">Open Work</Button>
          </Link>
          {addToTodayPlan && (
            <Link href="/plan" className="flex-1 min-w-[120px]">
              <Button variant="secondary" className="w-full">
                Open Planner
              </Button>
            </Link>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Convert to Work Item"
      description={idea.title || 'Untitled Idea'}
      onClose={onClose}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg bg-los-bg-secondary px-3 py-2 text-xs text-los-text-secondary">
          Copies title, description, and notes into the Work system.
        </div>

        <div>
          <p className="los-section-label mb-2">Priority</p>
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                disabled={!addToTodayPlan}
                className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all disabled:opacity-40 ${
                  priority === p.value
                    ? 'border-los-gold bg-los-gold text-los-text-inverse shadow-los-card'
                    : 'border-los-border text-los-text-secondary hover:border-los-border-gold hover:bg-los-bg-secondary'
                }`}
              >
                <span className="block">{p.label}</span>
                <span className="block text-[10px] font-normal opacity-70">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="convert-hours" className="los-section-label mb-2 block">
            Estimated Hours
          </label>
          <input
            id="convert-hours"
            type="number"
            min={0.25}
            step={0.25}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            disabled={!addToTodayPlan}
            className="los-input min-h-[44px] w-full disabled:opacity-40"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-los-text-primary">
          <input
            type="checkbox"
            checked={addToTodayPlan}
            onChange={(e) => setAddToTodayPlan(e.target.checked)}
            className="size-4 rounded border-los-border"
          />
          Add to today&apos;s plan
        </label>

        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1">
            Convert
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
