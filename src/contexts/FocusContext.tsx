'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { FocusSession } from '@/types'
import { getAllSessions, addSession, updateSession } from '@/lib/focus'
import {
  checkFirstMissionCompletion,
  markFirstMissionObjective,
} from '@/lib/first-experience/mission'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface ActiveSessionData {
  session: FocusSession
  taskTitle: string
}

interface FocusContextType {
  activeSession: ActiveSessionData | null
  activeWorkItemId: string | null
  startFocus: (workItemId: string, taskTitle: string) => void
  stopFocus: () => void
  focusSessions: FocusSession[]
}

const FocusContext = createContext<FocusContextType | null>(null)

export function FocusProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null)
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])

  useEffect(() => {
    setFocusSessions(getAllSessions())
  }, [])

  const refreshSessions = useCallback(() => {
    setFocusSessions(getAllSessions())
  }, [])

  const startFocus = useCallback((workItemId: string, taskTitle: string) => {
    const now = Date.now()
    const todayStr = today()

    if (activeSession) {
      const elapsed = now - activeSession.session.startTime
      const completed: FocusSession = {
        ...activeSession.session,
        endTime: now,
        duration: elapsed,
      }
      updateSession(completed)
    }

    const session: FocusSession = {
      id: crypto.randomUUID(),
      workItemId,
      startTime: now,
      endTime: 0,
      duration: 0,
      date: todayStr,
      createdAt: now,
    }
    addSession(session)
    setActiveSession({ session, taskTitle })
    refreshSessions()
  }, [activeSession, refreshSessions])

  const stopFocus = useCallback(() => {
    if (!activeSession) return
    const now = Date.now()
    const elapsed = now - activeSession.session.startTime
    const completed: FocusSession = {
      ...activeSession.session,
      endTime: now,
      duration: elapsed,
    }
    updateSession(completed)
    setActiveSession(null)
    refreshSessions()
    if (elapsed > 0) {
      markFirstMissionObjective('activity')
      checkFirstMissionCompletion()
    }
  }, [activeSession, refreshSessions])

  const activeWorkItemId = activeSession?.session.workItemId ?? null

  return (
    <FocusContext.Provider
      value={{
        activeSession,
        activeWorkItemId,
        startFocus,
        stopFocus,
        focusSessions,
      }}
    >
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider')
  }
  return context
}
