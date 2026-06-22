import type { ReactNode } from 'react'
import Card from '@/components/ui/Card'

interface AISurfaceProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function AIBadge({ label, poweredByGemini }: { label: string; poweredByGemini?: boolean }) {
  return (
    <p className="los-ai-badge">
      {label}
      {poweredByGemini && <span className="text-los-ai-light"> · Gemini</span>}
    </p>
  )
}

export function AIRecommendation({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="los-ai-recommendation">
      <p className="los-section-label text-los-ai-light">{label}</p>
      <div className="mt-2 text-sm font-medium text-los-text-primary leading-relaxed">{children}</div>
    </div>
  )
}

export default function AISurface({ children, className = '', padding = 'md' }: AISurfaceProps) {
  return (
    <Card variant="ai" className={`los-ai-surface relative overflow-hidden ${paddingStyles[padding]} ${className}`}>
      <div className="los-ai-surface-glow" aria-hidden />
      <div className="relative">{children}</div>
    </Card>
  )
}
