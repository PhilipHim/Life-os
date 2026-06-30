'use client'

import { useState } from 'react'
import type { DailyPlanItem } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/common/Modal'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...item,
      priority,
      estimatedDuration: Math.max(1, parseInt(duration, 10) || 30),
      startTime: undefined,
    })
    onClose()
  }

  return (
    <Modal title="Edit Work Block" onClose={onClose} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="los-section-label mb-2">Priority</p>
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all ${
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
          <p className="los-section-label mb-2">Block Duration (minutes)</p>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 60, 90].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDuration(String(n))}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  parseInt(duration, 10) === n
                    ? 'border-los-gold bg-los-gold text-los-text-inverse shadow-los-card'
                    : 'border-los-border text-los-text-secondary hover:border-los-border-gold hover:bg-los-bg-secondary'
                }`}
              >
                {n < 60 ? `${n}m` : `${n / 60}h`}
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Custom"
              className="los-input min-h-[36px] w-20 px-2"
              aria-label="Custom duration in minutes"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1">
            Save Changes
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
