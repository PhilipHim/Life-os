'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useDailyPlan } from '@/lib/DailyPlanContext'

const priorities = [
  { value: 'H1', label: 'H1', description: 'Critical' },
  { value: 'H2', label: 'H2', description: 'High' },
  { value: 'M', label: 'M', description: 'Medium' },
  { value: 'L', label: 'L', description: 'Low' },
] as const

interface Props {
  workItemId: string
  workItemTitle: string
  onClose: () => void
}

export default function AddToPlanFlow({ workItemId, workItemTitle, onClose }: Props) {
  const { addToPlan } = useDailyPlan()
  const [priority, setPriority] = useState<'H1' | 'H2' | 'M' | 'L'>('M')
  const [duration, setDuration] = useState('30')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addToPlan(workItemId, priority, Math.max(1, parseInt(duration, 10) || 30))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Add to Today Plan</h2>
        <p className="text-sm text-gray-500 mb-5 truncate">{workItemTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Priority</p>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all ${
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
              Estimated Duration (minutes)
            </p>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">
              Confirm
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
