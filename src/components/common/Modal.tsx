'use client'

import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  title: string
  titleId?: string
  description?: string
  onClose: () => void
  children: ReactNode
  maxWidth?: 'sm' | 'md'
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
} as const

export default function Modal({
  title,
  titleId = 'modal-title',
  description,
  onClose,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? `${titleId}-desc` : undefined}
        className={`relative z-10 w-full ${maxWidthClass[maxWidth]} max-h-[90vh] overflow-y-auto rounded-t-xl border border-los-border bg-los-bg-card p-4 shadow-los-elevated sm:rounded-xl sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]`}
      >
        <h2 id={titleId} className="text-lg font-semibold text-los-text-primary">
          {title}
        </h2>
        {description && (
          <p id={`${titleId}-desc`} className="mt-1 text-sm text-los-text-secondary">
            {description}
          </p>
        )}
        <div className={description ? 'mt-5' : 'mt-4'}>{children}</div>
      </div>
    </div>
  )
}
