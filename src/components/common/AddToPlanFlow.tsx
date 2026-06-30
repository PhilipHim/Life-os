'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/common/Modal'
import { useDailyPlan } from '@/contexts/DailyPlanContext'

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
    <Modal
      title="Add to Today Plan"
      description={workItemTitle}
      onClose={onClose}
      maxWidth="sm"
    >
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
          <p className="los-section-label mb-2">Estimated Duration (minutes)</p>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="los-input"
            required
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
    </Modal>
  )
}
