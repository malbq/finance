import { useLoaderData } from 'react-router'
import { BalanceEvolutionChart } from '~/components/BalanceEvolutionChart'
import { SpendingByCategoryChart } from '~/components/SpendingByCategoryChart'
import { SpendingByCategoryTable } from '~/components/SpendingByCategoryTable'
import { prisma } from '~/lib/db.server'
import { GetDashboardData } from '~/use-cases/analytics/GetDashboardData'

export async function loader() {
  const getDashboardData = new GetDashboardData(prisma)
  return await getDashboardData.execute()
}

export default function Dashboard() {
  const {
    totalBalanceFormatted,
    bankBalance,
    investmentBalance,
    balanceEvolution = [],
    movingAverages,
    spendingByCategory = [],
  } = useLoaderData<typeof loader>()

  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='col-span-2'>
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
