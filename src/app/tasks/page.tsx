'use client'

import { useState } from 'react'
import type { Project, Task } from '@/lib/types'
import { useTasks } from '@/lib/TaskContext'
import { useFocus } from '@/lib/FocusContext'
import { updateTask } from '@/lib/db/tasks'
import TaskItem from '@/components/TaskItem'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DetailsPanel from '@/components/DetailsPanel'

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask, isCompletedToday } = useTasks()
  const { startFocus } = useFocus()
  const [input, setInput] = useState('')
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly'>('none')
  const [panelTask, setPanelTask] = useState<Task | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    addTask(title, recurring === 'none' ? undefined : recurring)
    setInput('')
    setRecurring('none')
  }

  const handleUpdate = (updated: Project | Task) => {
    updateTask(updated as Task)
    setPanelTask(null)
  }

  const oneTimeTasks = tasks.filter((t) => t.recurring === 'none')
  const recurringTasks = tasks.filter((t) => t.recurring !== 'none')
  const openTasks = oneTimeTasks.filter((t) => !t.completed)
  const completedTasks = oneTimeTasks.filter((t) => t.completed)

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a task..."
            className="min-h-[44px] flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          />
          <select
            value={recurring}
            onChange={(e) => setRecurring(e.target.value as 'none' | 'daily' | 'weekly')}
            className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          >
            <option value="none">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <Button type="submit">Add</Button>
        </form>
      </Card>

      {recurringTasks.length > 0 && (
        <Card className="p-0 divide-y divide-gray-100">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Today's Tasks ({recurringTasks.length})
            </p>
          </div>
          {recurringTasks.map((task) => {
            const doneToday = isCompletedToday(task)
            return (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onStartFocus={() => startFocus(task.id, task.title)}
                onOpenDetails={(t) => setPanelTask(t)}
                isDoneToday={doneToday}
              />
            )
          })}
        </Card>
      )}

      <Card className="p-0 divide-y divide-gray-100">
        {tasks.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No tasks yet. Add one above.</p>
        )}

        {tasks.length > 0 && openTasks.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">All tasks completed!</p>
          </div>
        )}

        {openTasks.length > 0 && (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                Open Tasks ({openTasks.length})
              </p>
            </div>
            {openTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onStartFocus={() => startFocus(task.id, task.title)}
                onOpenDetails={(t) => setPanelTask(t)}
                isDoneToday={false}
              />
            ))}
          </>
        )}
      </Card>

      {completedTasks.length > 0 && (
        <Card className="p-0 divide-y divide-gray-100">
          <button
            onClick={() => setShowCompleted((prev) => !prev)}
            className="flex items-center justify-between w-full px-6 py-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span className="font-medium">Completed ({completedTasks.length})</span>
            <svg
              className={`size-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCompleted && (
            <div className="opacity-60">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onStartFocus={() => startFocus(task.id, task.title)}
                  onOpenDetails={(t) => setPanelTask(t)}
                  isDoneToday={false}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {panelTask && (
        <DetailsPanel
          isOpen
          onClose={() => setPanelTask(null)}
          type="task"
          entity={panelTask}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
