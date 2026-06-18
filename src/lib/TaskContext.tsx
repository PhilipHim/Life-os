'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Task } from '@/lib/types'
import { getTasks, addTask as persistAdd, updateTask as persistUpdate, deleteTask as persistDelete } from '@/lib/db/tasks'

interface TaskContextType {
  tasks: Task[]
  addTask: (title: string, recurring?: 'daily' | 'weekly') => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  isCompletedToday: (task: Task) => boolean
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

const TaskContext = createContext<TaskContextType | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks())
  }, [])

  const addTask = (title: string, recurring?: 'daily' | 'weekly') => {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      description: '',
      notes: '',
      completed: false,
      recurring: recurring ?? 'none',
      completedAt: null,
      createdAt: Date.now(),
    }
    setTasks(persistAdd(task))
  }

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const now = Date.now()
    if (task.recurring !== 'none') {
      if (task.completed && task.completedAt && new Date(task.completedAt).toISOString().split('T')[0] === todayStr()) {
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
    return new Date(task.completedAt).toISOString().split('T')[0] === todayStr()
  }

  const deleteTask = (id: string) => {
    setTasks(persistDelete(id))
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask, isCompletedToday }}>
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
