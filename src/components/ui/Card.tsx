import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section'
}

export default function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </Tag>
  )
}
