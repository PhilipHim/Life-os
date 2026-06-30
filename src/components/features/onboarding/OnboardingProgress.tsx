'use client'

interface OnboardingProgressProps {
  step: number
  total: number
}

export default function OnboardingProgress({ step, total }: OnboardingProgressProps) {
  const percent = Math.round((step / total) * 100)

  return (
    <div className="mb-8 w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-los-text-muted">
        <span>
          Step {step} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-los-bg-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Onboarding progress, step ${step} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-los-gold transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
