import { useEffect, useState } from 'react'
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis } from 'recharts'
import type { Props as LabelProps } from 'recharts/types/component/Label'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatKilo } from '../../utils/formatKilo'

const CustomLabel = (props: LabelProps) => {
  const { x, y, width, height, value } = props
  if (
    typeof value !== 'number' ||
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  )
    return null

  return (
    <text
      x={x + width / 2}
      y={value >= 0 ? y - 4 : y + height - 4}
      textAnchor='middle'
      fontSize={12}
      fill='#ccc'
    >
      {formatKilo(value)}
    </text>
  )
}

interface BarShapeProps {
  payload: BalanceEvolutionData
  x?: number
  y?: number
  width?: number
  height?: number
}

const customBarShape = (props: unknown) => {
  if (!props || typeof props !== 'object') {
    return <rect x={0} y={0} width={0} height={0} fill='transparent' />
  }

  const typedProps = props as BarShapeProps
  const { payload, x = 0, y = 0, width = 0, height = 0 } = typedProps

  if (!payload) {
    return <rect x={0} y={0} width={0} height={0} fill='transparent' />
  }

  const barFill = payload.balance >= 0 ? '#05df72' : '#ef4444'
  const barHeight = Math.abs(height)

  return (
    <rect
      x={x}
      y={payload.balance >= 0 ? y : y - barHeight}
      width={width}
      height={barHeight}
      fill={barFill}
    />
  )
}

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
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getVisibleData = () => {
    if (windowWidth < 640) return data.slice(0, 3)
    if (windowWidth < 768) return data.slice(0, 6)
    if (windowWidth < 1024) return data.slice(0, 9)
    return data
  }

  const visibleData = getVisibleData()

  return (
    <div className='bg-zinc-800 rounded-lg p-4 grid gap-x-8 grid-cols-2 lg:grid-cols-[auto_auto_1fr]'>
      <span className='col-span-2 text-lg font-semibold'>Projeção de Saldo</span>

      <div>
        <div className='text-xs text-zinc-400'>Saldo</div>
        <div className='text-sm font-semibold text-blue-400'>{totalBalance}</div>
        <div className='text-xs font-semibold'>
          {formatCurrency(bankBalance)} <span className='text-[10px] text-neutral-500'>CC</span>
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
        <div className='text-xs text-zinc-400'>Despesa (MM6)</div>
        <div className='text-sm font-semibold text-red-400'>
          {formatCurrency(movingAverages.totalMonthlySpending)}
        </div>
        <div className='text-xs text-zinc-400'>Economia</div>
        <div
          className={`text-sm font-semibold ${
            movingAverages.expectedSavings >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {formatCurrency(movingAverages.expectedSavings)}
        </div>
      </div>
      <div className='col-span-2 min-h-[120px] lg:col-start-3 lg:col-span-1 lg:row-start-1 lg:row-span-2'>
        <ResponsiveContainer
          width='100%'
          height='100%'
        >
          <BarChart
            data={visibleData}
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
              shape={customBarShape}
            >
              <LabelList
                dataKey='balance'
                content={<CustomLabel />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
