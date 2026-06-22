import type { ElementType, ReactNode } from 'react'

type HeadingLevel = 1 | 2 | 3 | 4

const headingSize: Record<HeadingLevel, string> = {
  1: 'text-4xl font-bold tracking-tight',
  2: 'text-2xl font-semibold tracking-wide',
  3: 'text-xl font-semibold tracking-wide',
  4: 'text-lg font-semibold',
}

const headingTag: Record<HeadingLevel, ElementType> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
}

interface HeadingProps {
  level?: HeadingLevel
  children: ReactNode
  className?: string
  as?: ElementType
}

/** Cinzel — titles, section headers, profile name, level titles. */
export function Heading({ level = 2, children, className = '', as }: HeadingProps) {
  const Tag = as ?? headingTag[level]
  return (
    <Tag className={`font-heading text-los-text-primary ${headingSize[level]} ${className}`}>
      {children}
    </Tag>
  )
}

interface SectionLabelProps {
  children: ReactNode
  className?: string
}

/** Inter — uppercase micro-labels for sections and stats. */
export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] text-los-text-muted ${className}`}>
      {children}
    </p>
  )
}

interface BodyTextProps {
  children: ReactNode
  className?: string
  muted?: boolean
  as?: ElementType
}

/** Inter — default body copy. */
export function BodyText({ children, className = '', muted = false, as: Tag = 'p' }: BodyTextProps) {
  return (
    <Tag
      className={`text-sm leading-relaxed ${muted ? 'text-los-text-muted' : 'text-los-text-secondary'} ${className}`}
    >
      {children}
    </Tag>
  )
}
