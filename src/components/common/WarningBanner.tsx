import type { ReactNode } from 'react'
import Card from '@/components/ui/Card'

interface WarningBannerProps {
  children: ReactNode
  className?: string
}

export default function WarningBanner({ children, className = '' }: WarningBannerProps) {
  return (
    <Card className={`border-los-warning/40 bg-los-warning/10 p-4 ${className}`}>
      <p className="text-sm text-los-warning">{children}</p>
    </Card>
  )
}
