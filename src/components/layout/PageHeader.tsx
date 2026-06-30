import type { ReactNode } from 'react'
import { losClasses } from '@/design-system/tokens'

interface PageHeaderProps {
  title: string
  subtitle?: string
  meta?: string
  eyebrow?: string
  children?: ReactNode
}

export default function PageHeader({ title, subtitle, meta, eyebrow, children }: PageHeaderProps) {
  const split = Boolean(children)

  return (
    <header
      className={`los-page-header ${split ? 'los-page-header--split gap-4' : ''}`}
    >
      <div className="los-page-header__lead">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-los-gold">{eyebrow}</p>
        )}
        <h1 className={`${losClasses.pageTitle} ${eyebrow ? 'mt-1' : ''}`}>{title}</h1>
        {subtitle && <p className={`mt-2 ${losClasses.pageSubtitle}`}>{subtitle}</p>}
        {meta && <p className="mt-1 text-xs text-los-text-muted">{meta}</p>}
      </div>
      {children ? <div className="los-page-header__actions">{children}</div> : null}
    </header>
  )
}
