'use client'

import Link from 'next/link'
import { CompassIcon } from '@/design-system/icons'
import Card from '@/components/ui/Card'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-8 sm:py-12">
      <Link href="/" className="los-brand group mb-8 flex items-center gap-3">
        <span className="los-brand-mark" aria-hidden>
          <CompassIcon size={24} className="text-los-gold" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-heading text-xl font-semibold tracking-[0.14em] text-los-text-primary transition-colors group-hover:text-los-gold">
            ASCEND
          </span>
          <span className="los-brand-subtitle">Build Your Character</span>
        </span>
      </Link>

      <Card className="w-full">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-los-text-primary sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-los-text-secondary">{subtitle}</p>}
        </div>
        {children}
      </Card>

      {footer && <div className="mt-6 w-full text-center text-sm text-los-text-secondary">{footer}</div>}
    </div>
  )
}

function AuthMessage({
  tone,
  children,
}: {
  tone: 'error' | 'success'
  children: React.ReactNode
}) {
  const styles =
    tone === 'error'
      ? 'border-los-danger/40 bg-los-danger/10 text-red-300'
      : 'border-los-success/40 bg-los-success/10 text-emerald-300'

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-sm ${styles}`} role="alert">
      {children}
    </div>
  )
}

export { AuthMessage }
