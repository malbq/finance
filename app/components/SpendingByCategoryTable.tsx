import type { DashboardData } from '../../api/lib/getDashboardData'
import { CATEGORY_MAP, type CategoryId } from '../../domain/Categories'
import { formatCurrency } from '../../utils/formatCurrency'

interface SpendingByCategoryProps {
  data: DashboardData['spendingByCategory']
}

function monthKeyToIndex(monthKey: string): number {
  const [mmStr, yyStr] = monthKey.split('/')
  const mm = Number(mmStr)
  const yy = Number(yyStr)
  if (!Number.isFinite(mm) || !Number.isFinite(yy)) return 0
  return (2000 + yy) * 12 + (mm - 1)
}

export const SpendingByCategoryTable = ({ data }: SpendingByCategoryProps) => {
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
  const months = Array.from(new Set(data.map((item) => item.month))).sort(
    (a, b) => monthKeyToIndex(a) - monthKeyToIndex(b)
  )
  const lastMonth = months[months.length - 1]
  const categories = Array.from(allKeys).sort((a, b) => {
    const aValue = data.find((item) => item.month === lastMonth)?.[a] || 0
    const bValue = data.find((item) => item.month === lastMonth)?.[b] || 0
    return bValue - aValue
  })

  if (categories.length === 0) {
    return <div>Nenhuma categoria de despesas encontrada</div>
  }

  const getMonthTotal = (month: string) => {
    const monthData = data.find((item) => item.month === month)
    return monthData?.total || 0
  }

  return (
    <div className='bg-zinc-800 rounded-lg p-4'>
      <h2 className='text-xl font-semibold text-white mb-4'>Despesas por Categoria</h2>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='border-b border-zinc-700'>
              <th className='text-left px-2 py-1 text-xs font-medium text-zinc-300'>Categoria</th>
              {months.map((month) => (
                <th
                  key={month}
                  className='text-right px-2 py-1 text-xs font-medium text-zinc-300'
                >
                  {month}
                </th>
              ))}
            </tr>
            <tr className='border-b border-zinc-600 hover:bg-zinc-700/50'>
              <th className='text-left px-2 py-1 text-xs font-bold text-zinc-200'>Total</th>
              {months.map((month) => (
                <th
                  key={month}
                  className='text-right px-2 py-1 text-xs font-bold text-zinc-200'
                >
                  {formatCurrency(getMonthTotal(month))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr
                key={category}
                className={`border-b border-zinc-700 hover:bg-zinc-700/50 ${
                  index % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-850'
                }`}
              >
                <td className='px-2 py-1 text-xs text-white font-medium'>
                  {CATEGORY_MAP[category]}
                </td>
                {months.map((month) => {
                  const monthData = data.find((item) => item.month === month)
                  const value = monthData?.[category]
                  return (
                    <td
                      key={month}
                      className={`px-2 py-1 text-xs text-right text-zinc-300 ${
                        value ? '' : 'text-zinc-600'
                      }`}
                    >
                      {value ? formatCurrency(value) : '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
