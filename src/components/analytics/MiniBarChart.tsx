'use client'

interface BarPoint {
  label: string
  value: number
}

type BarVariant = 'gold' | 'ai' | 'success' | 'default'

interface MiniBarChartProps {
  data: BarPoint[]
  max?: number
  unit?: string
  variant?: BarVariant
  colorClass?: string
  height?: number
}

const variantClasses: Record<BarVariant, string> = {
  gold: 'bg-gradient-to-t from-los-gold-dark via-los-gold to-los-gold-light',
  ai: 'bg-gradient-to-t from-violet-700 via-los-ai to-los-ai-light',
  success: 'bg-los-success',
  default: 'bg-los-text-secondary',
}

export default function MiniBarChart({
  data,
  max,
  unit = '',
  variant = 'gold',
  colorClass,
  height = 80,
}: MiniBarChartProps) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1)
  const barClass = colorClass ?? variantClasses[variant]

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => {
        const pct = peak > 0 ? (d.value / peak) * 100 : 0
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-los-text-muted tabular-nums truncate w-full text-center">
              {d.value > 0 ? `${d.value}${unit}` : '—'}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${barClass} ${d.value === 0 ? 'opacity-20' : 'opacity-100'}`}
                style={{ height: `${Math.max(pct, d.value > 0 ? 8 : 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-los-text-muted truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
