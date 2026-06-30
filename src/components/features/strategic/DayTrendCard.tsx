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
    <Card className="los-trend-day-card p-2 text-center sm:p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-los-text-muted sm:mb-1.5">{dayLabel}</p>
      <p className={`text-lg font-bold tabular-nums sm:text-xl ${scoreTone(score)}`}>{score}</p>
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
