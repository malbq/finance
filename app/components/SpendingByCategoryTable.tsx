import { memo, useCallback, useMemo } from 'react'
import { CATEGORY_MAP, type CategoryId } from '../../domain/Categories'
import { formatCurrency } from '../../utils/formatCurrency'
import { useSpendingGoal, useSpendingGoals } from '../hooks/useSpendingGoals'

interface SpendingByCategoryProps {
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

type Goal = {
  goal: number | null
  tolerance: number | null
}

type CategoryRowProps = {
  category: CategoryId
  index: number
  months: string[]
  lastMonth: string | undefined
  monthDataByMonth: Map<string, SpendingByCategoryProps['data'][number]>
  updateGoal: (
    categoryId: CategoryId,
    updates: {
      goalInput?: string
      toleranceInput?: string
    }
  ) => void
}

const CategoryRow = memo(function CategoryRow({
  category,
  index,
  months,
  lastMonth,
  monthDataByMonth,
  updateGoal
}: CategoryRowProps) {
  // This subscribes to only this category goal changes.
  const goal = useSpendingGoal(category)

  const getGoalStatus = useCallback(
    (month: string, value: number | undefined) => {
      if (value === undefined) return ''
      if (goal.goal === null) return ''

      const tolerancePercent = goal.tolerance ?? 0
      const toleranceAmount = goal.goal * (tolerancePercent / 100)

      if (value > goal.goal + toleranceAmount) return 'over'
      if (value < goal.goal - toleranceAmount) return 'under'
      return ''
    },
    [goal.goal, goal.tolerance, lastMonth]
  )

  const handleGoalChange = useCallback(
    (goalInput: string) => {
      updateGoal(category, { goalInput })
    },
    [category, updateGoal]
  )

  const handleToleranceChange = useCallback(
    (toleranceInput: string) => {
      updateGoal(category, { toleranceInput })
    },
    [category, updateGoal]
  )

  return (
    <tr
      className='group relative
                hover:after:content-[""]
                hover:after:absolute
                hover:after:left-0
                hover:after:top-0
                hover:after:right-0
                hover:after:bottom-0
                hover:after:ring-1 hover:after:ring-inset
                hover:after:ring-zinc-300
                hover:after:z-20
                hover:after:pointer-events-none'
    >
      <td
        className={`sticky left-0 z-10 px-2 py-1 text-xs text-white font-medium ${
          index % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-900'
        }`}
      >
        {CATEGORY_MAP[category]}
      </td>
      <td className={`${index % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-900'}`}>
        <div className='flex align-center gap-0.5'>
          <input
            type='number'
            min={0}
            placeholder='$'
            value={goal.goal ?? ''}
            onChange={(e) => handleGoalChange(e.target.value)}
            className='w-18 h-6 p-px
                       focus-within:outline-none focus-within:ring-inset focus-within:ring-1 focus-within:ring-zinc-300
                       group-hover:bg-white/10
                        text-xs text-right placeholder-zinc-500'
          />
          <input
            type='number'
            min={0}
            max={99}
            placeholder='%'
            value={goal.tolerance ?? ''}
            onChange={(e) => handleToleranceChange(e.target.value)}
            className='w-8 h-6 p-px
                       focus-within:outline-none focus-within:ring-inset focus-within:ring-1 focus-within:ring-zinc-300
                       group-hover:bg-white/10
                       text-xs text-right placeholder-zinc-500'
          />
        </div>
      </td>
      {months.map((month) => {
        const monthData = monthDataByMonth.get(month)
        const value = monthData?.[category]
        const goalStatus = getGoalStatus(month, value)
        return (
          <td
            key={month}
            className={`
                         px-2 py-1 text-xs text-right
                         ${
                           value === 0 || value === undefined
                             ? 'text-zinc-600'
                             : goalStatus === 'over'
                               ? 'text-red-400 font-extrabold text-shadow-[0px_0_10px_red]'
                               : goalStatus === 'under'
                                 ? 'text-green-400 text-shadow-[0px_0_10px_#0d0]'
                                 : `text-zinc-300`
                         }
                         ${index % 2 === 0 ? `bg-zinc-800` : `bg-zinc-900`}`}
          >
            {value ? formatCurrency(value) : '-'}
          </td>
        )
      })}
    </tr>
  )
})

export const SpendingByCategoryTable = ({ data, className = '' }: SpendingByCategoryProps) => {
  // Subscribe once for update function, but avoid rerendering table on goal changes.
  const { updateGoal } = useSpendingGoals()

  if (!data || data.length === 0) {
    return <div>Nenhum dado de despesas disponível</div>
  }

  const { months, lastMonth, monthDataByMonth, categories } = useMemo(() => {
    const allKeys = new Set<CategoryId>()
    const monthDataByMonth = new Map<string, SpendingByCategoryProps['data'][number]>()

    data.forEach((item) => {
      monthDataByMonth.set(item.month, item)
      Object.keys(item).forEach((key) => {
        if (key !== 'month' && key !== 'total' && key !== 'salary') {
          allKeys.add(key as CategoryId)
        }
      })
    })

    const months = Array.from(new Set(data.map((item) => item.month))).sort(
      (a, b) => monthKeyToIndex(a) - monthKeyToIndex(b)
    )
    const lastMonth = months[months.length - 1]

    const lastMonthData = lastMonth ? monthDataByMonth.get(lastMonth) : undefined
    const categories = Array.from(allKeys).sort((a, b) => {
      const aValue = lastMonthData?.[a] || 0
      const bValue = lastMonthData?.[b] || 0
      return bValue - aValue
    })

    return { months, lastMonth, monthDataByMonth, categories }
  }, [data])

  if (categories.length === 0) {
    return <div>Nenhuma categoria de despesas encontrada</div>
  }

  const getMonthTotal = useCallback(
    (month: string) => {
      return monthDataByMonth.get(month)?.total || 0
    },
    [monthDataByMonth]
  )

  return (
    <div className={`${className} flex flex-col lg:overflow-hidden lg:h-full`}>
      <h2 className='text-xl font-semibold text-white mb-4'>Despesas por Categoria</h2>
      <div className='overflow-y-auto overflow-x-auto flex-1'>
        <table className='w-full border-collapse'>
          <thead className='sticky top-0 z-20 shadow-[0_1px_0_0_#555]'>
            <tr>
              <th className='sticky left-0 z-10 bg-zinc-900 text-left px-2 py-1 text-xs font-medium text-zinc-300'>
                Categoria
              </th>
              <th className='text-left px-2 py-1 text-xs font-medium bg-zinc-900 text-zinc-300'>
                Meta
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className='text-right px-2 py-1 text-xs font-medium bg-zinc-900 text-zinc-300'
                >
                  {month}
                </th>
              ))}
            </tr>
            <tr>
              <th className='sticky left-0 z-10 bg-zinc-900 text-left px-2 py-1 text-xs font-bold text-zinc-200'>
                Total
              </th>
              <th className='bg-zinc-900'></th>
              {months.map((month) => (
                <th
                  key={month}
                  className='bg-zinc-900 text-right px-2 py-1 text-xs font-bold text-zinc-200'
                >
                  {formatCurrency(getMonthTotal(month))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <CategoryRow
                key={category}
                category={category}
                index={index}
                months={months}
                lastMonth={lastMonth}
                monthDataByMonth={monthDataByMonth}
                updateGoal={updateGoal}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
