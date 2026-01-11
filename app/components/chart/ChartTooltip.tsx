import { Fragment } from 'react'
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

  return (
    <div className='bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg'>
      <div className='text-white font-medium mb-2'>{label}</div>
      {payload.map((entry, index) => (
        <Fragment key={entry.dataKey ?? index}>
          <div
            className='text-sm'
            style={{ color: entry.color }}
          >
            {`${entry.name || entry.dataKey}: ${formatCurrency(entry.value)}`}
          </div>
          {index === 1 && <hr className='border-zinc-600 my-1' />}
        </Fragment>
      ))}
    </div>
  )
}
