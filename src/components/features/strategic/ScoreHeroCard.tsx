import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'

interface BreakdownItem {
  label: string
  score: number
  max: number
  percentage: number
}

interface ScoreHeroCardProps {
  label: string
  total: number
  max: number
  breakdown: BreakdownItem[]
  accent?: 'gold' | 'default'
}

function BreakdownRow({ label, score, max, percentage }: BreakdownItem) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-los-text-secondary">{label}</span>
        <span className="font-medium tabular-nums text-los-text-primary">
          {score}
          <span className="font-normal text-los-text-muted"> / {max}</span>
        </span>
      </div>
      <div className="mt-1.5">
        <ProgressBar value={percentage} variant="gold" size="sm" />
      </div>
    </div>
  )
}

export default function ScoreHeroCard({
  label,
  total,
  max,
  breakdown,
  accent = 'gold',
}: ScoreHeroCardProps) {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0

  return (
    <Card variant={accent === 'gold' ? 'gold' : 'default'} className="los-score-hero relative overflow-hidden p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-los-gold to-transparent opacity-70" />
      <div className="text-center">
        <p className="los-section-label">{label}</p>
        <p className="mt-4 font-heading text-7xl font-bold tabular-nums leading-none text-los-text-primary">
          {total}
          <span className="text-3xl font-normal text-los-text-muted"> / {max}</span>
        </p>
        <div className="mt-5 max-w-sm mx-auto">
          <ProgressBar value={pct} variant="gold" size="lg" />
        </div>
        <div className="mt-8 space-y-3 max-w-sm mx-auto text-left">
          {breakdown.map((item) => (
            <BreakdownRow key={item.label} {...item} />
          ))}
        </div>
      </div>
    </Card>
  )
}
