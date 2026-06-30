'use client'

import { useCallback, useRef, useState } from 'react'

interface SlideToConfirmProps {
  label: string
  confirmedLabel?: string
  onConfirm: () => void
  disabled?: boolean
  tone?: 'danger' | 'warning'
}

const THUMB_SIZE = 48
const TRACK_PADDING = 4
const CONFIRM_THRESHOLD = 0.9

export default function SlideToConfirm({
  label,
  confirmedLabel = 'Confirmed',
  onConfirm,
  disabled = false,
  tone = 'danger',
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragXRef = useRef(0)
  const draggingRef = useRef(false)
  const confirmedRef = useRef(false)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const toneStyles =
    tone === 'danger'
      ? {
          track: 'border-los-danger/40 bg-los-danger/10',
          fill: 'bg-los-danger/25',
          thumb: 'bg-los-danger text-white',
          text: 'text-red-300',
        }
      : {
          track: 'border-los-warning/40 bg-los-warning/10',
          fill: 'bg-los-warning/25',
          thumb: 'bg-los-warning text-los-text-inverse',
          text: 'text-amber-200',
        }

  const getMaxDrag = useCallback(() => {
    const track = trackRef.current
    if (!track) return 0
    return Math.max(track.clientWidth - THUMB_SIZE - TRACK_PADDING * 2, 0)
  }, [])

  const setDragPosition = useCallback((x: number, isDragging: boolean) => {
    dragXRef.current = x
    setDragX(x)
    setDragging(isDragging)
  }, [])

  const finishDrag = useCallback(() => {
    if (!draggingRef.current || disabled || confirmedRef.current) return
    draggingRef.current = false

    const max = getMaxDrag()
    const current = dragXRef.current

    if (max > 0 && current >= max * CONFIRM_THRESHOLD) {
      confirmedRef.current = true
      setDragPosition(max, false)
      setConfirmed(true)
      onConfirm()
      return
    }

    setDragPosition(0, false)
  }, [disabled, getMaxDrag, onConfirm, setDragPosition])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || confirmedRef.current) return
    if (event.button !== 0) return

    event.preventDefault()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)

    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const x = Math.min(
      Math.max(event.clientX - rect.left - THUMB_SIZE / 2 - TRACK_PADDING, 0),
      getMaxDrag()
    )
    setDragPosition(x, true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || disabled || confirmedRef.current) return

    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const x = Math.min(
      Math.max(event.clientX - rect.left - THUMB_SIZE / 2 - TRACK_PADDING, 0),
      getMaxDrag()
    )
    setDragPosition(x, true)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    finishDrag()
  }

  const maxDrag = getMaxDrag()
  const progress = maxDrag > 0 ? dragX / maxDrag : 0

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative h-14 select-none overflow-hidden rounded-full border touch-none ${toneStyles.track} ${disabled || confirmed ? 'opacity-60' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ touchAction: 'none' }}
      >
        <div
          className={`absolute inset-y-0 left-0 ${toneStyles.fill} ${dragging ? '' : 'transition-[width] duration-300 ease-out'}`}
          style={{ width: `${Math.max(progress * 100, 0)}%` }}
        />
        <p
          className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium ${toneStyles.text} ${progress > 0.35 ? 'opacity-40' : ''}`}
        >
          {confirmed ? confirmedLabel : label}
        </p>
        <div
          className={`absolute top-1 flex items-center justify-center rounded-full shadow-los-card ${toneStyles.thumb} ${dragging ? 'scale-105' : 'transition-transform duration-300 ease-out'}`}
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            left: TRACK_PADDING,
            transform: `translateX(${dragX}px)`,
            transition: dragging ? 'none' : 'transform 300ms ease-out',
          }}
          aria-hidden
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
      <p className="text-center text-xs text-los-text-muted">
        Drag the slider all the way to confirm
      </p>
    </div>
  )
}
