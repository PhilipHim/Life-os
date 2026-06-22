import type { ReactNode } from 'react'

type CardVariant = 'default' | 'gold' | 'ai' | 'interactive'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section'
  variant?: CardVariant
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border-los-border bg-los-bg-card shadow-los-card',
  gold: 'border-los-border-gold bg-los-bg-card shadow-los-card los-card-gold-accent',
  ai: 'border-los-border-ai bg-los-bg-card shadow-los-card los-card-ai-accent',
  interactive:
    'border-los-border bg-los-bg-card shadow-los-card transition-all duration-200 hover:border-los-border-gold hover:shadow-los-card-hover',
}

export default function Card({
  children,
  className = '',
  as: Tag = 'div',
  variant = 'default',
}: CardProps) {
  return (
    <Tag className={`rounded-xl border p-6 ${variantStyles[variant]} ${className}`}>
      {children}
    </Tag>
  )
}
