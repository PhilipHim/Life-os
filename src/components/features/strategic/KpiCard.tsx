import Link from 'next/link'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'

interface KpiCardProps {
  label: string
  metric: string
  sublabel?: string
  progress?: number
  href: string
  highlight?: boolean
}

export default function KpiCard({ label, metric, sublabel, progress, href, highlight }: KpiCardProps) {
  return (
    <Link href={href} className="block group h-full">
      <Card
        variant={highlight ? 'gold' : 'interactive'}
        className={`p-4 h-full transition-all duration-200 group-hover:-translate-y-0.5 cursor-pointer ${highlight ? '' : 'los-kpi-card'}`}
      >
        <p className="los-section-label">{label}</p>
        <p className={`mt-2 text-2xl font-bold tabular-nums ${highlight ? 'text-los-gold' : 'text-los-text-primary'}`}>
          {metric}
        </p>
        {sublabel && <p className="mt-1 text-xs text-los-text-muted">{sublabel}</p>}
        {progress !== undefined && (
          <div className="mt-3">
            <ProgressBar value={progress} variant="gold" size="sm" />
          </div>
        )}
      </Card>
    </Link>
  )
}
