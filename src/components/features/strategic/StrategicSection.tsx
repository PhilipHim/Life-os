import type { ReactNode } from 'react'
import Link from 'next/link'

interface StrategicSectionProps {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  icon?: ReactNode
  children: ReactNode
}

export function StrategicSection({ title, subtitle, href, linkLabel, icon, children }: StrategicSectionProps) {
  return (
    <section className="los-strategic-section">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-los-gold">{icon}</span>}
            <h2 className="font-heading text-xl font-semibold tracking-wide text-los-text-primary">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-sm text-los-text-secondary">{subtitle}</p>}
          <span className="los-strategic-section-rule" aria-hidden />
        </div>
        {href && linkLabel && (
          <Link href={href} className="shrink-0 text-xs font-medium text-los-gold hover:text-los-gold-light transition-colors">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function StrategicSubheading({ children }: { children: ReactNode }) {
  return <h3 className="los-section-label mb-3">{children}</h3>
}
