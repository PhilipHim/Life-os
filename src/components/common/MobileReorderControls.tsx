'use client'

interface MobileReorderControlsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  disableUp?: boolean
  disableDown?: boolean
  className?: string
}

export default function MobileReorderControls({
  onMoveUp,
  onMoveDown,
  disableUp = false,
  disableDown = false,
  className = '',
}: MobileReorderControlsProps) {
  return (
    <div className={`flex shrink-0 flex-col gap-0.5 md:hidden ${className}`}>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disableUp}
        aria-label="Move up"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-los-border bg-los-bg-card text-los-text-secondary transition-colors hover:border-los-border-gold hover:bg-los-bg-secondary disabled:pointer-events-none disabled:opacity-30"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disableDown}
        aria-label="Move down"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-los-border bg-los-bg-card text-los-text-secondary transition-colors hover:border-los-border-gold hover:bg-los-bg-secondary disabled:pointer-events-none disabled:opacity-30"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
