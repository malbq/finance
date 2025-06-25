interface LegendPayloadEntry {
  value: string
  color: string
  dataKey?: string
}

interface ChartLegendProps {
  payload?: LegendPayloadEntry[]
  className?: string
}

export const ChartLegend = ({ payload, className = '' }: ChartLegendProps) => {
  if (!payload || !payload.length) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center gap-2"
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-zinc-300">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
