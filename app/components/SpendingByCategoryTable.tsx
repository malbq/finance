import {
  CATEGORY_MAP,
  type CategoryId,
} from '~/domain/transactions/entities/Categories'
import type { DashboardData } from '~/use-cases/analytics/GetDashboardData'
import { formatCurrency } from '~/utils/formatCurrency'

interface SpendingByCategoryProps {
  data: DashboardData['spendingByCategory']
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
  const categories = Array.from(allKeys).sort((a, b) =>
    CATEGORY_MAP[a].localeCompare(CATEGORY_MAP[b])
  )
  const months = data.map((item) => item.month)

  if (categories.length === 0) {
    return <div>Nenhuma categoria de despesas encontrada</div>
  }

  const getMonthTotal = (month: string) => {
    const monthData = data.find((item) => item.month === month)
    return monthData?.total || 0
  }

  return (
    <div className='bg-zinc-800 rounded-lg p-4'>
      <h2 className='text-xl font-semibold text-white mb-4'>
        Despesas por Categoria
      </h2>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='border-b border-zinc-700'>
              <th className='text-left p-3 text-sm font-medium text-zinc-300'>
                Categoria
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className='text-right p-3 text-sm font-medium text-zinc-300'
                >
                  {month}
                </th>
              ))}
            </tr>
            <tr className='border-b border-zinc-600'>
              <th className='text-left p-3 text-sm font-bold text-zinc-200'>
                Total
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className='text-right p-3 text-sm font-bold text-zinc-200'
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
                className={`border-b border-zinc-700 ${
                  index % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-850'
                }`}
              >
                <td className='p-3 text-sm text-white font-medium'>
                  {CATEGORY_MAP[category]}
                </td>
                {months.map((month) => {
                  const monthData = data.find((item) => item.month === month)
                  const value = monthData?.[category]
                  return (
                    <td
                      key={month}
                      className={`p-3 text-sm text-right text-zinc-300 ${
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
