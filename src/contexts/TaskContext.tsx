'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Task } from '@/types'
import {
  getTasks,
  addTask as persistAdd,
  updateTask as persistUpdate,
  deleteTask as persistDelete,
  softDeleteTask as persistSoftDelete,
  restoreTask as persistRestore,
  deleteAllCompletedTasks as persistDeleteAllCompleted,
  emptyTrashTasks as persistEmptyTrash,
} from '@/database/tasks'
import { localDateStr } from '@/utils/date'

interface TaskContextType {
  tasks: Task[]
  addTask: (payload: {
    title: string
    description?: string
    notes?: string
    recurring?: 'daily' | 'weekly'
    priority?: Task['priority']
    estimatedDuration?: number
  }) => void
  updateTask: (updated: Task) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  restoreTask: (id: string) => void
  permanentDeleteTask: (id: string) => void
  deleteAllCompleted: () => void
  emptyTrash: () => void
  isCompletedToday: (task: Task) => boolean
}

function todayStr(): string {
  return localDateStr()
}

const TaskContext = createContext<TaskContextType | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks())
  }, [])

  const addTask = (payload: {
    title: string
    description?: string
    notes?: string
    recurring?: 'daily' | 'weekly'
    priority?: Task['priority']
    estimatedDuration?: number
  }) => {
    const task: Task = {
      id: crypto.randomUUID(),
      title: payload.title,
      description: payload.description ?? '',
      notes: payload.notes ?? '',
      completed: false,
      deleted: false,
      recurring: payload.recurring ?? 'none',
      completedAt: null,
      createdAt: Date.now(),
      priority: payload.priority ?? 'M',
      estimatedDuration: payload.estimatedDuration ?? 30,
    }
    setTasks(persistAdd(task))
  }

  const updateTask = (updated: Task) => {
    setTasks(persistUpdate(updated))
  }

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const now = Date.now()
    if (task.recurring !== 'none') {
      if (task.completed && task.completedAt && localDateStr(new Date(task.completedAt)) === todayStr()) {
        setTasks(persistUpdate({ ...task, completed: false, completedAt: null }))
      } else {
        setTasks(persistUpdate({ ...task, completed: true, completedAt: now }))
      }
    } else {
      setTasks(persistUpdate({ ...task, completed: !task.completed }))
    }
  }

  const isCompletedToday = (task: Task): boolean => {
    if (task.recurring === 'none') return task.completed
    if (!task.completed || !task.completedAt) return false
    return localDateStr(new Date(task.completedAt)) === todayStr()
  }

  const deleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    if (task.recurring !== 'none') {
      setTasks(persistDelete(id))
      return
    }
    setTasks(persistSoftDelete(id))
  }

  const restoreTask = (id: string) => {
    setTasks(persistRestore(id))
  }

  const permanentDeleteTask = (id: string) => {
    setTasks(persistDelete(id))
  }

  const deleteAllCompleted = () => {
    setTasks(persistDeleteAllCompleted())
  }

  const emptyTrash = () => {
    setTasks(persistEmptyTrash())
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        restoreTask,
        permanentDeleteTask,
        deleteAllCompleted,
        emptyTrash,
        isCompletedToday,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}
