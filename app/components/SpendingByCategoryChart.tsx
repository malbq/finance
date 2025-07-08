import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CATEGORY_MAP,
  type CategoryId,
} from '~/domain/transactions/entities/Categories'
import type { DashboardData } from '~/use-cases/analytics/GetDashboardData'
import { formatCurrency } from '~/utils/formatCurrency'
import { ChartTooltip } from './chart/ChartTooltip'

interface SpendingChartProps {
  data: DashboardData['spendingByCategory']
}

const colors = [
  'hsl(0, 70%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(60, 70%, 50%)',
  'hsl(90, 70%, 50%)',
  'hsl(120, 70%, 50%)',
  'hsl(150, 70%, 50%)',
  'hsl(180, 70%, 50%)',
  'hsl(210, 70%, 50%)',
  'hsl(240, 70%, 50%)',
  'hsl(270, 70%, 50%)',
  'hsl(300, 70%, 50%)',
  'hsl(330, 70%, 50%)',
]

export const SpendingByCategoryChart = ({ data }: SpendingChartProps) => {
  if (!data || data.length === 0) {
    return <div>Nenhum dado de despesas disponível</div>
  }

  const allKeys = new Set<CategoryId>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'month' && key !== 'total' && key !== 'salary') {
        allKeys.add(key as CategoryId)
      }
    })
  })
  const categories = Array.from(allKeys).sort((catA, catB) => {
    const lastMonth = data[data.length - 2]
    const catAValue = lastMonth[catA] || 0
    const catBValue = lastMonth[catB] || 0
    return catBValue - catAValue
  })

  if (categories.length === 0) {
    return <div>Nenhuma categoria de despesas encontrada</div>
  }

  return (
    <div className='bg-zinc-800 rounded-lg p-4'>
      <h2 className='text-xl font-semibold text-white mb-4'>Movimentação</h2>
      <div className='h-200'>
        <ResponsiveContainer
          width='100%'
          height='100%'
        >
          <ComposedChart data={data}>
            <CartesianGrid
              strokeDasharray='3 3'
              stroke='#444'
            />
            <XAxis
              dataKey='month'
              stroke='#aaa'
              fontSize={12}
            />
            <YAxis
              stroke='#aaa'
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Line
              type='monotone'
              dataKey='salary'
              name='Entradas'
              stroke='#22C55E'
              strokeWidth={3}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
            />
            <Line
              type='monotone'
              dataKey='total'
              name='Saídas'
              stroke='#ff4444'
              strokeWidth={3}
              dot={{ fill: '#ff4444', strokeWidth: 2, r: 4 }}
            />
            {categories.map((category, index) => (
              <Area
                key={category}
                type='monotone'
                dataKey={category}
                stackId='1'
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                name={CATEGORY_MAP[category]}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
