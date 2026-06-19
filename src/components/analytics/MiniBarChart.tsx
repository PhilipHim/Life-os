'use client'

interface BarPoint {
  label: string
  value: number
}

interface MiniBarChartProps {
  data: BarPoint[]
  max?: number
  unit?: string
  colorClass?: string
  height?: number
}

export default function MiniBarChart({
  data,
  max,
  unit = '',
  colorClass = 'bg-gray-900',
  height = 80,
}: MiniBarChartProps) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => {
        const pct = peak > 0 ? (d.value / peak) * 100 : 0
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-gray-400 tabular-nums truncate w-full text-center">
              {d.value > 0 ? `${d.value}${unit}` : '—'}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${colorClass} ${d.value === 0 ? 'opacity-20' : 'opacity-100'}`}
                style={{ height: `${Math.max(pct, d.value > 0 ? 8 : 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
