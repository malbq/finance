import { createFileRoute } from '@tanstack/react-router'
import { BalanceEvolutionChart } from '../components/BalanceEvolutionChart'
import { SpendingByCategoryChart } from '../components/SpendingByCategoryChart'
import { SpendingByCategoryTable } from '../components/SpendingByCategoryTable'
import { useDashboardData } from '../hooks/useDashboardData'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data, isLoading, error } = useDashboardData()

  if (isLoading) {
    return <div className='text-zinc-300'>Loading...</div>
  }

  if (error) {
    return <div className='text-red-400'>Error loading dashboard data</div>
  }

  if (!data) {
    return null
  }

  const {
    totalBalanceFormatted,
    bankBalance,
    investmentBalance,
    balanceEvolution = [],
    movingAverages,
    spendingByCategory = [],
  } = data

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <div className='lg:col-span-2'>
        <BalanceEvolutionChart
          data={balanceEvolution}
          totalBalance={totalBalanceFormatted}
          bankBalance={bankBalance}
          investmentBalance={investmentBalance}
          movingAverages={movingAverages}
        />
      </div>
      <div>
        <SpendingByCategoryChart data={spendingByCategory} />
      </div>
      <div>
        <SpendingByCategoryTable data={spendingByCategory} />
      </div>
    </div>
  )
}
