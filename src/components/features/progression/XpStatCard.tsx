import Card from '@/components/ui/Card'
import { StarIcon } from '@/design-system/icons'

interface XpStatCardProps {
  label: string
  value: string
  sublabel?: string
  highlight?: boolean
}

export default function XpStatCard({ label, value, sublabel, highlight = false }: XpStatCardProps) {
  return (
    <Card
      variant={highlight ? 'gold' : 'default'}
      className={`p-4 ${highlight ? '' : 'los-xp-stat-card'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="los-section-label">{label}</p>
        {highlight && <StarIcon size={14} className="shrink-0 text-los-gold" />}
      </div>
      <p
        className={`mt-2 text-2xl font-bold tabular-nums ${
          highlight ? 'text-los-gold' : 'text-los-text-primary'
        }`}
      >
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-los-text-muted">{sublabel}</p>}
    </Card>
  )
}
