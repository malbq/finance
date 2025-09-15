import { useLoaderData } from 'react-router'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '~/utils/formatCurrency'
import { formatKilo } from '~/utils/formatKilo'

const rawTransactions = [
  { date: '07-01', label: 'Saldo inicial', value: 0 },
  { date: '07-08', label: 'Salário', value: 15000 },
  { date: '07-09', label: 'aluguel', value: -4500 },
  { date: '07-09', label: 'carro finan. 5/18', value: -3997 },
  { date: '07-23', label: 'Salário', value: 15000 },
  { date: '07-24', label: 'iptu', value: -165 },
  { date: '07-26', label: 'funcionária', value: -2100 },
  { date: '07-30', label: 'creche', value: -2622 },
  { date: '07-30', label: 'energia', value: -600 },
  { date: '07-30', label: 'condomínio', value: -1000 },
  { date: '07-30', label: '💳Inter: carro taxas', value: -589 },
  { date: '07-30', label: '💳Inter: brisanet+tim', value: -170 },
  { date: '07-30', label: '💳Itau: seguros vida', value: -700 },
  { date: '07-30', label: '💳Itau: netflix', value: -21 },
  { date: '07-30', label: '💳Itau: outras parcelas', value: -2720 },
  { date: '07-30', label: '💳Itau: outras compras', value: -6400 },
]

interface ChartData {
  date: string
  day: number
  income: number
  incomeStack: number
  expense: number
  expenseStack: number
  balance: number
  transactions: Array<{ label: string; value: number }>
}

export async function loader() {
  const month = parseInt(rawTransactions[0].date.slice(0, 2))
  const lastMonthDay = new Date(new Date().getFullYear(), month, 0).getDate()
  const data: Array<ChartData> = []
  let runningBalance = 0
  for (let day = 1; day <= lastMonthDay; day++) {
    const date = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    const current: ChartData = {
      date,
      day,
      income: 0,
      incomeStack: 0,
      expense: 0,
      expenseStack: 0,
      balance: runningBalance,
      transactions: [],
    }

    rawTransactions
      .filter((transaction) => transaction.date === date)
      .forEach((transaction) => {
        if (transaction.value > 0) {
          current.income += transaction.value
        } else if (transaction.value < 0) {
          current.expense += Math.abs(transaction.value)
        }
        runningBalance += transaction.value
        current.balance = runningBalance

        current.transactions.push({
          label: transaction.label,
          value: transaction.value,
        })
      })
    current.incomeStack = current.income > 0 ? (data[day - 2]?.balance ?? 0) : 0
    current.expenseStack = current.expense > 0 ? (current.balance ?? 0) : 0
    data.push(current)
  }

  return data
}

export default function Cashflow() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className='space-y-6 border border-zinc-600 rounded-lg p-4'>
      <h2 className='text-xl font-semibold text-white mb-4'>Movimentações fixas de Julho 2025</h2>
      <div className='h-[500px]'>
        <ResponsiveContainer
          width='100%'
          height='100%'
        >
          <ComposedChart
            data={data}
            margin={{ left: 30 }}
            barCategoryGap={0}
            barGap={0}
          >
            <CartesianGrid
              strokeDasharray='2 4'
              stroke='#444'
              vertical={false}
            />
            <XAxis
              type='category'
              dataKey='day'
              stroke='#aaa'
              fontSize={11}
            />
            <YAxis
              type='number'
              stroke='#aaa'
              fontSize={12}
              width={20}
              tickFormatter={formatKilo}
              ticks={[0, 5000, 10000, 15000, 20000, 25000]}
            />
            <Tooltip content={<CustomCashflowTooltip />} />
            <Legend
              content={() => (
                <div className='flex flex-wrap gap-4 justify-center'>
                  <div className='flex items-center gap-2'>
                    <div className={`w-3 h-3 bg-[#5dbd40]`} />
                    <span>Entradas</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className={`w-3 h-3 bg-[#ff6961]`} />
                    <span>Saídas</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className={`w-3 h-3 bg-[#05df8b] opacity-30`} />
                    <span>Saldo</span>
                  </div>
                </div>
              )}
            />

            <Bar
              stackId='stack'
              dataKey='incomeStack'
              fill='transparent'
            />
            <Bar
              stackId='stack'
              dataKey='income'
              name='Entradas'
              fill='#5dbd40'
            >
              <LabelList
                dataKey='income'
                position='top'
                fill='#5dbd40'
                fontSize={12}
                formatter={(value) => formatKilo(Number(value))}
              />
            </Bar>
            <Bar
              stackId='stack2'
              dataKey='expenseStack'
              fill='transparent'
            />
            <Bar
              stackId='stack2'
              dataKey='expense'
              name='Saídas'
              fill='#ff6961'
              stroke='#ff6961'
              strokeWidth={1.5}
            >
              <LabelList
                dataKey='expense'
                position='top'
                fill='#ff6961'
                fontSize={12}
                formatter={(value) => formatKilo(-1 * Number(value))}
              />
            </Bar>
            <Area
              type='stepAfter'
              dataKey='balance'
              name='Saldo'
              fill='#05df8b'
              stroke='none'
              fillOpacity={0.3}
            >
              <LabelList
                valueAccessor={({ payload }: { payload: ChartData }, index: number) => {
                  const { balance } = payload
                  const changed = balance !== data[index - 1]?.balance
                  return changed ? balance : 0
                }}
                position='insideTopLeft'
                fill='#fff'
                fontSize={12}
                formatter={(value) => formatKilo(Number(value))}
              />
            </Area>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const CustomCashflowTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: {
    dataKey: string
    value: number
    payload: ChartData
  }[]
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const chartDataPoint = payload[0].payload

  const date = new Date(chartDataPoint.date)
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className='bg-zinc-800 border border-zinc-600 rounded-lg p-4 shadow-lg max-w-xs'>
      <div className='text-white text-sm mb-3'>{formattedDate}</div>

      {payload
        .filter(
          (entry) =>
            entry.dataKey !== 'incomeStack' &&
            entry.dataKey !== 'expenseStack' &&
            (entry.dataKey === 'balance' || entry.value > 0)
        )
        .map((entry: any, index: number) => (
          <div
            key={index}
            className='text-sm mb-1'
            style={{ color: entry.color }}
          >
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </div>
        ))}

      {chartDataPoint.transactions.length > 0 && (
        <>
          <hr className='border-zinc-600 my-2' />
          <div className='space-y-1'>
            {chartDataPoint.transactions.map((transaction: any, index: number) => (
              <div
                key={index}
                className='text-xs flex justify-between items-center'
              >
                <span className='text-zinc-300 truncate mr-2'>{transaction.label}</span>
                <span
                  className={`font-medium ${
                    transaction.value > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatCurrency(transaction.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
