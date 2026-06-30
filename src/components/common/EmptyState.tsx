import type { ReactNode } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  title?: string
  children: ReactNode
  action?: EmptyStateAction
  className?: string
}

export default function EmptyState({ title, children, action, className = '' }: EmptyStateProps) {
  return (
    <Card className={`text-center ${className}`}>
      <div className="mx-auto max-w-md space-y-3 py-2">
        {title && (
          <h3 className="font-heading text-lg font-semibold text-los-text-primary">{title}</h3>
        )}
        <p className="los-empty-state text-sm leading-relaxed text-los-text-secondary">{children}</p>
        {action && (
          <div className="pt-2">
            {action.href ? (
              <Link href={action.href}>
                <Button size="sm">{action.label}</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
