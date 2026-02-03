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
import { CATEGORY_MAP, type CategoryId } from '../../domain/Categories'
import { ChartTooltip } from './chart/ChartTooltip'

interface SpendingChartProps {
  data: Array<
    {
      month: string
      total: number
      salary: number
    } & {
      [categoryId in CategoryId]?: number
    }
  >
  className?: string
}

function monthKeyToIndex(monthKey: string): number {
  const [mmStr, yyStr] = monthKey.split('/')
  const mm = Number(mmStr)
  const yy = Number(yyStr)
  if (!Number.isFinite(mm) || !Number.isFinite(yy)) return 0
  return (2000 + yy) * 12 + (mm - 1)
}

const STACK_COLORS = [
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

export const SpendingByCategoryChart = ({ data, className = '' }: SpendingChartProps) => {
  if (!data || data.length === 0) {
    return <div>Nenhum dado de despesas disponível</div>
  }

  const sortedData = [...data].sort((a, b) => monthKeyToIndex(a.month) - monthKeyToIndex(b.month))

  const allKeys = new Set<CategoryId>()
  sortedData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'month' && key !== 'total' && key !== 'salary') {
        allKeys.add(key as CategoryId)
      }
    })
  })

  const monthToSortBy = sortedData.at(-1)!
  const categories = Array.from(allKeys).sort((catA, catB) => {
    const catAValue = monthToSortBy[catA] || 0
    const catBValue = monthToSortBy[catB] || 0
    return catBValue - catAValue
  })

  if (categories.length === 0) {
    return <div>Nenhuma categoria de despesas encontrada</div>
  }

  return (
    <div className={className}>
      <h2 className='text-xl font-semibold text-white mb-4'>Movimentação</h2>
      <div className='h-120'>
        <ResponsiveContainer
          width='100%'
          height='100%'
        >
          <ComposedChart data={sortedData}>
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
              tickFormatter={(value: number) => `${value / 1000}k`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type='monotone'
              dataKey='salary'
              name='Entradas'
              stroke='#0c0'
              strokeWidth={3}
              dot={{ fill: '#0c0', r: 4 }}
            />
            <Line
              type='monotone'
              dataKey='total'
              name='Saídas'
              stroke='#f33'
              strokeWidth={3}
              dot={{ fill: '#f33', r: 4 }}
            />
            {categories.map((category, index) => (
              <Area
                key={category}
                type='monotone'
                dataKey={category}
                stackId='1'
                stroke={STACK_COLORS[index % STACK_COLORS.length]}
                fill={STACK_COLORS[index % STACK_COLORS.length]}
                fillOpacity={0.2}
                name={CATEGORY_MAP[category]}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
