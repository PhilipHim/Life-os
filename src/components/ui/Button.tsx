'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-los-gold text-los-text-inverse hover:bg-los-gold-light shadow-los-card focus:ring-los-gold/50',
  gold:
    'bg-los-gold text-los-text-inverse hover:bg-los-gold-light shadow-los-card focus:ring-los-gold/50',
  secondary:
    'bg-los-bg-card text-los-text-primary border border-los-border hover:border-los-border-gold hover:bg-los-bg-secondary shadow-los-card',
  ghost: 'text-los-text-secondary hover:text-los-text-primary hover:bg-los-bg-secondary',
  ai: 'bg-los-ai text-white hover:bg-los-ai-light shadow-los-card focus:ring-los-ai/50',
  danger: 'bg-los-danger text-white hover:bg-red-500 shadow-los-card focus:ring-los-danger/50',
}

const sizeStyles: Record<Size, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs',
  md: 'min-h-[44px] px-5 py-2.5 text-sm',
  lg: 'min-h-[52px] px-7 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-los-bg-primary disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
