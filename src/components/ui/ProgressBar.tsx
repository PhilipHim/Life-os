'use client'

type ProgressVariant = 'gold' | 'ai' | 'success' | 'default'

interface ProgressBarProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

const fillStyles: Record<ProgressVariant, string> = {
  gold: 'bg-gradient-to-r from-los-gold-dark via-los-gold to-los-gold-light',
  ai: 'bg-gradient-to-r from-violet-700 via-los-ai to-los-ai-light',
  success: 'bg-los-success',
  default: 'bg-los-text-secondary',
}

const trackHeights = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
}

export default function ProgressBar({
  value,
  max = 100,
  variant = 'gold',
  size = 'md',
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-los-text-muted tabular-nums">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full bg-los-bg-secondary ring-1 ring-los-border ${trackHeights[size]}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillStyles[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
