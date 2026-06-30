'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CompassIcon } from '@/design-system/icons'
import { markWelcomeDismissed } from '@/database/first-experience'

interface WelcomeCardProps {
  onDismiss?: () => void
}

export default function WelcomeCard({ onDismiss }: WelcomeCardProps) {
  const handleDismiss = () => {
    markWelcomeDismissed()
    onDismiss?.()
  }

  return (
    <Card
      variant="gold"
      className="los-first-welcome relative overflow-hidden border-los-border-gold bg-gradient-to-br from-los-bg-card via-los-bg-card to-los-gold/10"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-los-gold/10 blur-2xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CompassIcon size={22} className="text-los-gold" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-los-gold">
              Welcome to ASCEND
            </p>
          </div>
          <h2 className="font-heading text-2xl font-bold text-los-text-primary sm:text-3xl">
            Your Personal Growth Operating System is ready.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-los-text-secondary">
            Today we&apos;ll help you build momentum. Complete your first mission below, explore the
            app, and start leveling up your character.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="shrink-0 self-start">
          Dismiss
        </Button>
      </div>
    </Card>
  )
}
