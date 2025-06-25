import { formatCurrency } from '~/utils/formatCurrency'

interface SpendingByCategoryData {
  month: string
  [category: string]: string | number
}

interface SpendingByCategoryProps {
  data: SpendingByCategoryData[]
}

export const SpendingByCategory = ({ data }: SpendingByCategoryProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6 max-h-[700px] overflow-y-auto">
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
  const months = data.map((item) => item.month)

  if (categories.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6 max-h-[700px] overflow-y-auto">
        <h2 className="text-xl font-semibold text-white mb-4">
          Gastos por Categoria
        </h2>
        <p className="text-zinc-400">Nenhuma categoria de gastos encontrada</p>
      </div>
    )
  }

  const getCategoryTotal = (category: string) => {
    return data.reduce((total, monthData) => {
      const value = monthData[category]
      return total + (typeof value === 'number' ? value : 0)
    }, 0)
  }

  const getMonthTotal = (month: string) => {
    const monthData = data.find((item) => item.month === month)
    return monthData?.total || 0
  }

  const sortedCategories = categories.sort((a, b) => {
    return getCategoryTotal(b) - getCategoryTotal(a)
  })

  return (
    <div className="bg-zinc-800 rounded-lg p-6 max-h-[700px] overflow-y-auto">
      <h2 className="text-xl font-semibold text-white mb-4">
        Gastos por Categoria
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left p-3 text-sm font-medium text-zinc-300">
                Categoria
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className="text-right p-3 text-sm font-medium text-zinc-300"
                >
                  {month}
                </th>
              ))}
            </tr>
            <tr className="border-b border-zinc-600">
              <th className="text-left p-3 text-sm font-bold text-zinc-200">
                Total
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className="text-right p-3 text-sm font-bold text-zinc-200"
                >
                  {formatCurrency({ toNumber: () => getMonthTotal(month) })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category, index) => (
              <tr
                key={category}
                className={`border-b border-zinc-700 ${
                  index % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-850'
                }`}
              >
                <td className="p-3 text-sm text-white font-medium">
                  {category}
                </td>
                {months.map((month) => {
                  const monthData = data.find((item) => item.month === month)
                  const value = monthData?.[category]
                  return (
                    <td
                      key={month}
                      className="p-3 text-sm text-right text-zinc-300"
                    >
                      {typeof value === 'number' && value > 0
                        ? formatCurrency({ toNumber: () => value })
                        : '-'}
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
