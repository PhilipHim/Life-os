'use client'

import type { Task } from '@/lib/types'
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

export default function TaskItem({ task, onToggle, onDelete, onStartFocus, onOpenDetails, isDoneToday }: TaskItemProps) {
  const done = task.recurring !== 'none' ? isDoneToday : task.completed
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
      <Checkbox checked={done} onChange={() => onToggle(task.id)} />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {task.recurring !== 'none' && (
          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
            {task.recurring === 'daily' ? 'DAILY' : 'WEEKLY'}
          </span>
        )}
        <span className={done ? 'text-gray-400 line-through' : 'text-gray-900'}>
          {task.title}
        </span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onOpenDetails(task)}>
          Details
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onStartFocus(task.id)}>
          Focus
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
          Delete
        </Button>
      </div>
    </div>
  )
}
