'use client'

import { useState, useEffect, useRef } from 'react'
import { useFocus } from '@/lib/FocusContext'
import Button from '@/components/ui/Button'

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export default function FocusOverlay() {
  const { activeSession, stopFocus } = useFocus()
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [totalPaused, setTotalPaused] = useState(0)
  const pauseStart = useRef<number>(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0)
      setIsPaused(false)
      setTotalPaused(0)
      return
    }

    const tick = () => {
      let pausedMs = totalPaused
      if (isPaused && pauseStart.current) {
        pausedMs += Date.now() - pauseStart.current
      }
      setElapsed(Date.now() - activeSession.session.startTime - pausedMs)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [activeSession, isPaused, totalPaused, activeSession?.session.startTime])

  if (!activeSession) return null

  const handlePause = () => {
    pauseStart.current = Date.now()
    setIsPaused(true)
  }

  const handleResume = () => {
    setTotalPaused((p) => p + Date.now() - pauseStart.current)
    pauseStart.current = 0
    setIsPaused(false)
  }

  const handleStop = () => {
    stopFocus()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Focus</p>
        <p className="mb-10 text-xl text-gray-300">{activeSession.taskTitle}</p>
        <p className="mb-12 font-mono text-8xl font-light tracking-wider text-white">
          {formatTime(elapsed)}
        </p>
        <div className="flex justify-center gap-4">
          {isPaused ? (
            <Button variant="secondary" size="lg" onClick={handleResume}>
              Resume
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={handlePause}>
              Pause
            </Button>
          )}
          <Button variant="danger" size="lg" onClick={handleStop}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  )
}
