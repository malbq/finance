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
    <div className='p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 h-full overflow-x-auto'>
      <BalanceEvolutionChart
        className='lg:col-span-2'
        data={balanceEvolution}
        totalBalance={totalBalanceFormatted}
        bankBalance={bankBalance}
        investmentBalance={investmentBalance}
        movingAverages={movingAverages}
      />
      <SpendingByCategoryTable data={spendingByCategory} />
      <SpendingByCategoryChart data={spendingByCategory} />
    </div>
  )
}
