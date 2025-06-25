import { formatCurrency } from '../../utils/formatCurrency'

interface TooltipPayloadEntry {
  color: string
  name?: string
  dataKey?: string
  value: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  sortByValue?: boolean
}

export const ChartTooltip = ({
  active,
  payload,
  label,
  sortByValue = false,
}: ChartTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const sortedPayload = sortByValue
    ? [...payload].sort((a, b) => b.value - a.value)
    : payload

  return (
    <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
      <p className="text-white font-medium mb-2">{label}</p>
      {sortedPayload.map((entry, index) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {`${entry.name || entry.dataKey}: ${formatCurrency(entry.value)}`}
        </p>
      ))}
    </div>
  )
}
