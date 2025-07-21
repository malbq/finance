import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis } from 'recharts'
import { formatCurrency } from '~/utils/formatCurrency'
import { formatKilo } from '~/utils/formatKilo'

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
    <div className='bg-zinc-800 rounded-lg p-4 grid grid-cols-[auto_auto_1fr] grid-rows-4 gap-x-8'>
      <span className='col-span-2 text-lg font-semibold'>
        Projeção de Saldo
      </span>
      <div className='row-span-3'>
        <div className='text-xs text-zinc-400'>Saldo</div>
        <div className='text-sm font-semibold text-blue-400'>
          {totalBalance}
        </div>
        <div className='text-xs font-semibold'>
          {formatCurrency(bankBalance)}{' '}
          <span className='text-[10px] text-neutral-500'>CC</span>
        </div>
        <div className='text-xs font-semibold'>
          {formatCurrency(investmentBalance)}{' '}
          <span className='text-[10px] text-neutral-500'>INV</span>
        </div>
      </div>

      <div>
        <div className='text-xs text-zinc-400'>Receita (MM6)</div>
        <div className='text-sm font-semibold'>
          {formatCurrency(movingAverages.totalMonthlyIncome)}
        </div>
      </div>

      <div>
        <div className='text-xs text-zinc-400'>Despesa (MM6)</div>
        <div className='text-sm font-semibold text-red-400'>
          {formatCurrency(movingAverages.totalMonthlySpending)}
        </div>
      </div>

      <div>
        <div className='text-xs text-zinc-400'>Economia</div>
        <div
          className={`text-sm font-semibold ${
            movingAverages.expectedSavings >= 0
              ? 'text-green-400'
              : 'text-red-400'
          }`}
        >
          {formatCurrency(movingAverages.expectedSavings)}
        </div>
      </div>
      <div className='row-start-1 row-span-4 col-start-3'>
        <ResponsiveContainer
          width='100%'
          height='100%'
        >
          <BarChart
            data={data}
            margin={{ top: 24 }}
          >
            <XAxis
              dataKey='month'
              stroke='#888'
              fontSize={12}
            />
            <Bar
              dataKey='balance'
              name='Saldo Projetado'
              fill='#05df72'
            >
              <LabelList
                dataKey='balance'
                position='top'
                fontSize={12}
                formatter={(value) => formatKilo(value as number)}
                fill='#ccc'
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
