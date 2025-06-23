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
import { formatCurrency } from '~/utils/formatCurrency'

interface SpendingChartData {
  month: string
  [category: string]: string | number
}

interface SpendingChartProps {
  data: SpendingChartData[]
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium mb-2">{`${label}`}</p>
        {payload
          .sort((a: any, b: any) => b.value - a.value)
          .map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {`${entry.dataKey}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
      </div>
    )
  }
  return null
}

export const SpendingChart = ({ data }: SpendingChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Gastos por Categoria
        </h2>
        <p className="text-zinc-400">Nenhum dado de gastos disponível</p>
      </div>
    )
  }

  const allKeys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'month' && key !== 'total' && key !== 'salary') {
        allKeys.add(key)
      }
    })
  })
  const categories = Array.from(allKeys)

  if (categories.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Movimentação</h2>
        <p className="text-zinc-400">Nenhuma categoria de gastos encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Movimentação</h2>
      <div className="h-200">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <ComposedChart
            data={data}
            margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
            />
            <XAxis
              dataKey="month"
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {categories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
            <Line
              type="monotone"
              dataKey="total"
              name="Saídas"
              stroke="#ff4444"
              strokeWidth={3}
              dot={{ fill: '#ff4444', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="salary"
              name="Entradas"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
