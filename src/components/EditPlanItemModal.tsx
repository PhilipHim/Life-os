'use client'

import { useState } from 'react'
import type { DailyPlanItem } from '@/lib/types'
import Button from '@/components/ui/Button'

const priorities = [
  { value: 'H1', label: 'H1', description: 'Critical' },
  { value: 'H2', label: 'H2', description: 'High' },
  { value: 'M', label: 'M', description: 'Medium' },
  { value: 'L', label: 'L', description: 'Low' },
] as const

interface Props {
  item: DailyPlanItem
  onSave: (updated: DailyPlanItem) => void
  onClose: () => void
}

export default function EditPlanItemModal({ item, onSave, onClose }: Props) {
  const [priority, setPriority] = useState<'H1' | 'H2' | 'M' | 'L'>(item.priority)
  const [duration, setDuration] = useState(String(item.estimatedDuration))
  const [startTime, setStartTime] = useState(item.startTime ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...item,
      priority,
      estimatedDuration: Math.max(1, parseInt(duration, 10) || 30),
      startTime: startTime.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Daily Plan Item</h2>

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
              Estimated Time (minutes)
            </p>
            <div className="flex gap-2">
              {[15, 30, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDuration(String(n))}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    parseInt(duration, 10) === n
                      ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {n < 60 ? `${n}min` : '1h'}
                </button>
              ))}
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Custom"
                className="min-h-[36px] w-20 rounded-lg border border-gray-300 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Start Time (optional)</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">Save Changes</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
