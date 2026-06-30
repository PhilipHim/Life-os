'use client'

import type { Task } from '@/types'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onStartFocus: (id: string) => void
  onOpenDetails: (task: Task) => void
  isDoneToday: boolean
}

const DELETE_BTN = 'text-red-500 hover:text-red-600 hover:bg-red-50'

export default function TaskItem({ task, onToggle, onDelete, onStartFocus, onOpenDetails, isDoneToday }: TaskItemProps) {
  const done = task.recurring !== 'none' ? isDoneToday : task.completed
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
      <Checkbox checked={done} onChange={() => onToggle(task.id)} />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {task.recurring !== 'none' && (
          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
            {task.recurring === 'daily' ? 'Daily' : 'Weekly'}
          </span>
        )}
        <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </span>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" onClick={() => onOpenDetails(task)}>
          Details
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onStartFocus(task.id)}>
          Focus
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} className={DELETE_BTN}>
          Delete
        </Button>
      </div>
    </div>
  )
}
