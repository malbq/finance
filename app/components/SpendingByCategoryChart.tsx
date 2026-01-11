import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardData } from '../../api/lib/getDashboardData'
import { CATEGORY_MAP, type CategoryId } from '../../domain/Categories'
import { formatCurrency } from '../../utils/formatCurrency'
import { ChartTooltip } from './chart/ChartTooltip'

interface SpendingChartProps {
  data: DashboardData['spendingByCategory']
}

const colors = [
  'hsl(25, 90%, 50%)',
  'hsl(50, 100%, 50%)',
  'hsl(150, 90%, 40%)',
  'hsl(180, 90%, 60%)',
  'hsl(210, 80%, 60%)',
  'hsl(240, 100%, 70%)',
  'hsl(270, 100%, 65%)',
  'hsl(300, 90%, 60%)',
  'hsl(345, 100%, 70%)',
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

  const monthToSortBy = data.at(-1)

  const categories = Array.from(allKeys).sort((catA, catB) => {
    const catAValue = monthToSortBy?.[catA] || 0
    const catBValue = monthToSortBy?.[catB] || 0
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
            <Line
              type='monotone'
              dataKey='salary'
              name='Entradas'
              stroke='#0c0'
              strokeWidth={3}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
            />
            <Line
              type='monotone'
              dataKey='total'
              name='Saídas'
              stroke='#f33'
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
