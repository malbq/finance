import { useLoaderData } from 'react-router'
import { BalanceEvolutionChart } from '~/components/balance-evolution-chart'
import { SpendingChart } from '~/components/spending-chart'
import { SpendingByCategory } from '~/components/SpendingByCategory'
import { prisma } from '~/lib/db.server'
import { GetDashboardData } from '~/use-cases/analytics/GetDashboardData'

export async function loader() {
  const getDashboardData = new GetDashboardData(prisma)
  return await getDashboardData.execute()
}

export default function Home() {
  const {
    totalBalanceFormatted,
    bankBalance,
    investmentBalance,
    balanceEvolution = [],
    movingAverages,
    spendingByCategory = [],
  } = useLoaderData<typeof loader>()

  return (
    <div className="space-y-6">
      <BalanceEvolutionChart
        data={balanceEvolution}
        totalBalance={totalBalanceFormatted}
        bankBalance={bankBalance}
        investmentBalance={investmentBalance}
        movingAverages={movingAverages}
      />

      <SpendingChart data={spendingByCategory} />

      <SpendingByCategory data={spendingByCategory} />
    </div>
  )
}
