import Card from '@/components/ui/Card'

function scoreTone(value: number): string {
  if (value >= 70) return 'text-los-success'
  if (value >= 40) return 'text-los-warning'
  return 'text-los-danger'
}

interface DayTrendCardProps {
  dayLabel: string
  score: number
  meta?: string[]
}

export default function DayTrendCard({ dayLabel, score, meta }: DayTrendCardProps) {
  return (
    <Card className="los-trend-day-card p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-los-text-muted mb-1.5">{dayLabel}</p>
      <p className={`text-xl font-bold tabular-nums ${scoreTone(score)}`}>{score}</p>
      {meta && meta.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {meta.map((line) => (
            <p key={line} className="text-[10px] text-los-text-muted tabular-nums">
              {line}
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}
