import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '~/utils/formatCurrency'
import { ChartTooltip } from './chart/ChartTooltip'

interface BalanceEvolutionData {
  month: string
  balance: number
}

interface MovingAverages {
  totalMonthlyIncome: number
  totalMonthlySpending: number
  expectedSavings: number
}

interface BalanceEvolutionChartProps {
  data: BalanceEvolutionData[]
  movingAverages: MovingAverages
  totalBalance: string
  bankBalance: number
  investmentBalance: number
}

export const BalanceEvolutionChart = ({
  data,
  movingAverages,
  totalBalance,
  bankBalance,
  investmentBalance,
}: BalanceEvolutionChartProps) => {
  return (
    <div className="bg-zinc-800 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Projeção de Saldo
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-zinc-400">Saldo</p>
            <p className="text-md font-semibold text-blue-300">
              {totalBalance}
            </p>
            <p className="text-sm font-semibold text-neutral-300">
              {formatCurrency(bankBalance)}{' '}
              <span className="text-xs text-neutral-500">CC</span>
            </p>
            <p className="text-sm font-semibold text-neutral-300">
              {formatCurrency(investmentBalance)}{' '}
              <span className="text-xs text-neutral-500">INV</span>
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-400">Receita Mensal (MM6)</p>
            <p className="text-md font-semibold text-neutral-200">
              {formatCurrency(movingAverages.totalMonthlyIncome)}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-400">Gastos Mensais (MM6)</p>
            <p className="text-md font-semibold text-red-400">
              {formatCurrency(movingAverages.totalMonthlySpending)}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-400">Economia Esperada</p>
            <p
              className={`text-md font-semibold ${
                movingAverages.expectedSavings >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {formatCurrency(movingAverages.expectedSavings)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Bar
              dataKey="balance"
              name="Saldo Projetado"
              fill="#05df72"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
