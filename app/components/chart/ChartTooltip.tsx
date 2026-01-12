import { formatCurrency } from '../../../utils/formatCurrency'

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
}

export const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null
  }
  const salary = payload[0]!
  const total = payload[1]!
  const categories = payload.slice(2)
  return (
    <div className='bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg'>
      <div className='text-white font-medium mb-2'>{label}</div>
      <div
        className='text-sm'
        style={{ color: salary.color }}
      >
        {`${salary.name}: ${formatCurrency(salary.value)}`}
      </div>
      <div
        className='text-sm'
        style={{ color: total.color }}
      >
        {`${total.name}: ${formatCurrency(total.value)}`}
      </div>
      <hr className='border-zinc-600 my-1' />
      {categories.map((entry) => (
        <div
          className='text-sm'
          style={{ color: entry.color }}
          key={entry.dataKey!}
        >
          {`${entry.name}: ${formatCurrency(entry.value)}`}
        </div>
      ))}
    </div>
  )
}
