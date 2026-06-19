'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useWorkItems } from '@/lib/WorkItemContext'
import { useDailyPlan } from '@/lib/DailyPlanContext'
import type { BusinessIdea } from '@/lib/types'

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Work Item Created</h2>
          <p className="text-sm text-gray-500 mb-5">
            &ldquo;{idea.title.trim() || 'Untitled Idea'}&rdquo; is now in your Work area
            {addToTodayPlan ? ' and added to today\u2019s plan' : ''}.
          </p>
          <div className="flex gap-2">
            <Link href="/work" className="flex-1">
              <Button className="w-full">Open Work</Button>
            </Link>
            {addToTodayPlan && (
              <Link href="/plan" className="flex-1">
                <Button variant="secondary" className="w-full">Open Planner</Button>
              </Link>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Convert to Work Item</h2>
        <p className="text-sm text-gray-500 mb-5 truncate">{idea.title || 'Untitled Idea'}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Copies title, description, and notes into the Work system.
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Priority</p>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  disabled={!addToTodayPlan}
                  className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all disabled:opacity-40 ${
                    priority === p.value
                      ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="block">{p.label}</span>
                  <span className="block text-[10px] font-normal opacity-70">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">
              Estimated Hours
            </p>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              disabled={!addToTodayPlan}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 disabled:opacity-40"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={addToTodayPlan}
              onChange={(e) => setAddToTodayPlan(e.target.checked)}
              className="size-4 rounded border-gray-300"
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
      </div>
    </div>
  )
}
