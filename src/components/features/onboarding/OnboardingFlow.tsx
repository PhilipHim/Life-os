'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CompassIcon } from '@/design-system/icons'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import OnboardingProgress from '@/components/features/onboarding/OnboardingProgress'
import { useAuth } from '@/hooks/useAuth'
import {
  completeOnboarding,
  ensureUserProfile,
  skipOnboarding,
} from '@/database/user-profile'
import { FOCUS_AREA_OPTIONS, type FocusArea } from '@/types/profile'

const TOTAL_STEPS = 5

function toggleFocusArea(current: FocusArea[], area: FocusArea): FocusArea[] {
  return current.includes(area) ? current.filter((a) => a !== area) : [...current, area]
}

export default function OnboardingFlow() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiConfigured, setAiConfigured] = useState(false)
  const [aiStatusLoaded, setAiStatusLoaded] = useState(false)

  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [vision, setVision] = useState('')

  useEffect(() => {
    if (user?.id) {
      void ensureUserProfile(user.id)
    }
  }, [user?.id])

  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        setAiConfigured(Boolean(data.configured))
      })
      .catch(() => setAiConfigured(false))
      .finally(() => setAiStatusLoaded(true))
  }, [])

  const goNext = useCallback(() => {
    setDirection('forward')
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }, [])

  const goBack = useCallback(() => {
    setDirection('back')
    setStep((s) => Math.max(s - 1, 1))
  }, [])

  const handleSkip = useCallback(async () => {
    if (!user?.id || saving) return
    setSaving(true)
    setError(null)
    const { error: skipError } = await skipOnboarding(user.id)
    setSaving(false)
    if (skipError) {
      setError(skipError)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }, [user?.id, saving, router])

  const handleComplete = useCallback(async () => {
    if (!user?.id || saving) return
    setSaving(true)
    setError(null)
    const { error: completeError } = await completeOnboarding(user.id, {
      focusAreas,
      vision,
    })
    setSaving(false)
    if (completeError) {
      setError(completeError)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }, [user?.id, saving, focusAreas, vision, router])

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-los-text-secondary">Loading…</p>
      </div>
    )
  }

  const slideClass =
    direction === 'forward' ? 'los-onboarding-enter-forward' : 'los-onboarding-enter-back'

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="los-brand group flex items-center gap-2.5">
          <span className="los-brand-mark" aria-hidden>
            <CompassIcon size={22} className="text-los-gold" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-[0.14em] text-los-text-primary transition-colors group-hover:text-los-gold">
            ASCEND
          </span>
        </Link>
        <button
          type="button"
          onClick={() => void handleSkip()}
          disabled={saving}
          className="text-sm text-los-text-muted transition-colors hover:text-los-text-secondary disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>

      <OnboardingProgress step={step} total={TOTAL_STEPS} />

      {error && (
        <div
          className="mb-4 rounded-lg border border-los-danger/40 bg-los-danger/10 px-3 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <div key={step} className={slideClass}>
        {step === 1 && (
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-los-border-gold bg-los-bg-card shadow-los-card">
              <CompassIcon size={40} className="text-los-gold" />
            </div>
            <div className="space-y-3">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-los-text-primary sm:text-4xl">
                Welcome to ASCEND
              </h1>
              <p className="text-lg font-medium text-los-gold">Build your character. Master your life.</p>
            </div>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-los-text-secondary">
              ASCEND is your Personal Growth Operating System. Track your progress. Build powerful
              routines. Stay consistent. Grow every day.
            </p>
            <Button size="lg" className="w-full" onClick={goNext}>
              Begin Your Journey
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <header className="space-y-1 text-center">
              <h1 className="font-heading text-2xl font-bold text-los-text-primary sm:text-3xl">
                Choose your focus
              </h1>
              <p className="text-sm text-los-text-secondary">What do you want to improve first?</p>
            </header>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {FOCUS_AREA_OPTIONS.map((area) => {
                const selected = focusAreas.includes(area)
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setFocusAreas((prev) => toggleFocusArea(prev, area))}
                    className={`rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                      selected
                        ? 'border-los-border-gold bg-los-gold/10 text-los-gold shadow-los-card'
                        : 'border-los-border bg-los-bg-card text-los-text-primary hover:border-los-border-gold/50 hover:bg-los-bg-secondary'
                    }`}
                    aria-pressed={selected}
                  >
                    {area}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={goBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <header className="space-y-1 text-center">
              <h1 className="font-heading text-2xl font-bold text-los-text-primary sm:text-3xl">
                Your Vision
              </h1>
              <p className="text-sm text-los-text-secondary">
                Where do you want to be one year from now?
              </p>
            </header>
            <textarea
              className="los-textarea min-h-[10rem] text-base"
              placeholder='Describe the life you want to build.&#10;&#10;Example: "I want to build an AI business while becoming healthier and more disciplined."'
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={6}
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={goBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <header className="space-y-1 text-center">
              <h1 className="font-heading text-2xl font-bold text-los-text-primary sm:text-3xl">
                Your AI Coach
              </h1>
              <p className="text-sm text-los-text-secondary">
                ASCEND includes an AI Coach that analyzes your habits, planner usage, and progress to
                guide your growth.
              </p>
            </header>
            <Card className="text-center">
              {aiStatusLoaded ? (
                aiConfigured ? (
                  <div className="space-y-2 py-2">
                    <p className="text-2xl font-semibold text-emerald-400">AI Connected ✓</p>
                    <p className="text-sm text-los-text-secondary">
                      Your coach is ready to help you level up.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <p className="text-lg font-medium text-los-text-primary">Connect Later</p>
                    <p className="text-sm text-los-text-secondary">
                      You can set up AI coaching anytime from your profile. No setup required to
                      start.
                    </p>
                  </div>
                )
              ) : (
                <p className="py-4 text-sm text-los-text-muted">Checking AI status…</p>
              )}
            </Card>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={goBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 text-center">
            <header className="space-y-1">
              <h1 className="font-heading text-2xl font-bold text-los-text-primary sm:text-3xl">
                You&apos;re Ready
              </h1>
            </header>
            <Card className="los-onboarding-level-card border-los-border-gold bg-gradient-to-b from-los-bg-card to-los-bg-secondary py-10">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-los-gold">
                  Character Created
                </p>
                <p className="font-heading text-5xl font-bold text-los-gold">Level 1</p>
                <p className="text-sm text-los-text-secondary">Your journey starts today.</p>
              </div>
            </Card>
            <Button
              size="lg"
              className="w-full"
              onClick={() => void handleComplete()}
              disabled={saving}
            >
              {saving ? 'Entering…' : 'Enter ASCEND'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={goBack} disabled={saving}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
