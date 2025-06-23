import { PrismaClient } from '@prisma-app/client'
import { useLoaderData } from 'react-router'
import { BalanceEvolutionChart } from '~/components/balance-evolution-chart'
import { SpendingChart } from '~/components/spending-chart'
import { formatCurrency } from '~/utils/formatCurrency'

const prisma = new PrismaClient()

export async function loader() {
  try {
    const categories = await prisma.category.findMany()
    const categoryMap = new Map(
      categories.map((cat) => [cat.id, cat.descriptionTranslated])
    )

    function getTranslatedCategory(
      categoryId: string | null,
      fallbackCategory: string | null
    ): string | null {
      if (categoryId && categoryMap.has(categoryId)) {
        return categoryMap.get(categoryId)!
      }
      return fallbackCategory
    }

    const accounts = await prisma.account.findMany({
      include: {
        bankData: true,
        creditData: true,
        transactions: {
          where: {
            categoryId: {
              notIn: [
                '03000000', // Investimentos
                '04000000', // Transferência para mesma pessoa
                '05100000', // Pagamento de cartão de crédito
                '12', // Ignore
              ],
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const investments = await prisma.investment.findMany({
      where: {
        status: {
          in: ['ACTIVE'],
        },
      },
    })

    function getBalanceValue(balance: any): number {
      if (balance === null || balance === undefined) return 0
      const value =
        typeof balance.toNumber === 'function'
          ? balance.toNumber()
          : parseFloat(balance.toString())
      return isNaN(value) ? 0 : value
    }

    function applyTimezoneOffset(date: Date): Date {
      const offsetHours = -3
      const offsetMs = offsetHours * 60 * 60 * 1000
      return new Date(date.getTime() + offsetMs)
    }

    function getMonthKeyWithOffset(date: Date): string {
      const adjustedDate = applyTimezoneOffset(date)
      const monthStart = new Date(
        adjustedDate.getFullYear(),
        adjustedDate.getMonth(),
        1
      )
      return monthStart.toISOString().slice(0, 7)
    }

    const bankBalance = accounts
      .filter((account) => account.type !== 'CREDIT')
      .reduce((sum, account) => sum + getBalanceValue(account.balance), 0)

    const investmentBalance = investments.reduce(
      (sum, investment) => sum + getBalanceValue(investment.balance),
      0
    )

    const totalBalance = bankBalance + investmentBalance

    const generateBalanceEvolution = async () => {
      const currentDate = new Date()
      const data = []

      // Get current balance for starting point
      const bankAccounts = accounts.filter((account) => account.type === 'BANK')
      let currentBalance = bankAccounts.reduce(
        (sum, account) => sum + getBalanceValue(account.balance),
        0
      )

      // Get the moving averages for all categories
      const latestSpendingProjections = (await prisma.$queryRawUnsafe(`
        SELECT category, moving_avg_6_months
        FROM category_spending_moving_average 
        WHERE moving_avg_6_months IS NOT NULL
      `)) as Array<{ category: string; moving_avg_6_months: number }>

      const latestIncomeProjections = (await prisma.$queryRawUnsafe(`
        SELECT category, moving_avg_6_months
        FROM category_income_moving_average 
        WHERE moving_avg_6_months IS NOT NULL
      `)) as Array<{ category: string; moving_avg_6_months: number }>

      // Calculate total monthly projections
      const totalMonthlySpending = latestSpendingProjections.reduce(
        (sum, projection) => sum + (projection.moving_avg_6_months || 0),
        0
      )

      const totalMonthlyIncome = latestIncomeProjections.reduce(
        (sum, projection) => sum + (projection.moving_avg_6_months || 0),
        0
      )

      // Calculate monthly savings (income - spending)
      const monthlyProjectedSavings = totalMonthlyIncome - totalMonthlySpending

      // Generate 24 months of projections (2 years)
      for (let i = 1; i <= 24; i++) {
        const futureDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + i,
          1
        )
        const monthName = futureDate.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        })

        // Calculate projected balance
        currentBalance += monthlyProjectedSavings

        data.push({
          month: monthName,
          balance: currentBalance,
        })
      }

      return {
        data,
        movingAverages: {
          totalMonthlyIncome: totalMonthlyIncome,
          totalMonthlySpending: totalMonthlySpending,
          expectedSavings: monthlyProjectedSavings,
        },
      }
    }

    const generateSpendingByCategory = () => {
      const data: Array<{
        month: string
        [category: string]: string | number
      }> = []

      const bankAccounts = accounts.filter((account) => account.type === 'BANK')
      const creditCards = accounts.filter(
        (account) => account.type === 'CREDIT'
      )

      const spendingTransactions = [
        ...bankAccounts.flatMap((account) =>
          account.transactions
            .filter((t) => {
              const amount = getBalanceValue(t.amount)
              return t.type === 'DEBIT' && amount !== 0
            })
            .map((t) => ({
              ...t,
              amount: Math.abs(getBalanceValue(t.amount)),
            }))
        ),
        ...creditCards.flatMap((account) =>
          account.transactions
            .filter((t) => {
              const amount = getBalanceValue(t.amount)
              return t.type === 'DEBIT' && amount !== 0
            })
            .map((t) => ({
              ...t,
              amount: Math.abs(getBalanceValue(t.amount)),
            }))
        ),
      ]

      const incomeTransactions = bankAccounts.flatMap((account) =>
        account.transactions
          .filter((t) => t.type === 'CREDIT' && t.categoryId === '01010000')
          .map((t) => ({
            ...t,
            amount: Math.abs(getBalanceValue(t.amount)),
          }))
      )

      if (spendingTransactions.length === 0) {
        return []
      }

      const allCategoryTotals: Record<string, number> = {}
      spendingTransactions.forEach((transaction) => {
        const category =
          getTranslatedCategory(transaction.categoryId, transaction.category) ||
          'Outros'
        const amount = Math.abs(transaction.amount)
        allCategoryTotals[category] =
          (allCategoryTotals[category] || 0) + amount
      })

      const allCategories = Object.entries(allCategoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category]) => category)

      const currentDate = new Date()
      const twelveMonthsAgo = new Date(currentDate)
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

      const filteredTransactions = spendingTransactions.filter(
        (transaction) => {
          const transactionDate = new Date(transaction.date)
          return (
            transactionDate >= twelveMonthsAgo && transactionDate <= currentDate
          )
        }
      )

      const filteredIncomeTransactions = incomeTransactions.filter(
        (transaction) => {
          const transactionDate = new Date(transaction.date)
          return (
            transactionDate >= twelveMonthsAgo && transactionDate <= currentDate
          )
        }
      )

      const monthsWithData = new Map<string, any[]>()
      const monthsWithIncome = new Map<string, any[]>()

      filteredTransactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date)
        const monthKey = getMonthKeyWithOffset(transactionDate)

        if (!monthsWithData.has(monthKey)) {
          monthsWithData.set(monthKey, [])
        }
        monthsWithData.get(monthKey)!.push(transaction)
      })

      filteredIncomeTransactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date)
        const monthKey = getMonthKeyWithOffset(transactionDate)

        if (!monthsWithIncome.has(monthKey)) {
          monthsWithIncome.set(monthKey, [])
        }
        monthsWithIncome.get(monthKey)!.push(transaction)
      })

      const allMonths = new Set([
        ...monthsWithData.keys(),
        ...monthsWithIncome.keys(),
      ])
      const sortedMonths = Array.from(allMonths).sort()

      for (const monthKey of sortedMonths) {
        const monthTransactions = monthsWithData.get(monthKey) || []
        const monthIncomeTransactions = monthsWithIncome.get(monthKey) || []
        const [year, month] = monthKey.split('-')
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const monthName = monthDate.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        })

        const categorySpending: Record<string, number> = {}

        monthTransactions.forEach((transaction) => {
          const category =
            getTranslatedCategory(
              transaction.categoryId,
              transaction.category
            ) || 'Outros'
          const amount = Math.abs(transaction.amount)

          if (!categorySpending[category]) {
            categorySpending[category] = 0
          }
          categorySpending[category] += amount
        })

        const monthData: {
          month: string
          [category: string]: string | number
        } = { month: monthName }

        let monthTotal = 0
        allCategories.forEach((category) => {
          const amount = categorySpending[category] || 0
          if (amount > 0) {
            monthData[category] = Math.abs(amount)
            monthTotal += amount
          }
        })

        const monthlySalary = monthIncomeTransactions.reduce(
          (sum, transaction) => sum + Math.abs(transaction.amount),
          0
        )

        if (monthTotal > 0 || monthlySalary > 0) {
          if (monthTotal > 0) {
            monthData.total = monthTotal
          }
          if (monthlySalary > 0) {
            monthData.salary = monthlySalary
          }
          data.push(monthData)
        }
      }

      const cleanedData = data.map((monthData) => {
        const cleaned = { ...monthData }
        Object.keys(cleaned).forEach((key) => {
          if (key !== 'month' && typeof cleaned[key] === 'number') {
            cleaned[key] = Math.abs(cleaned[key] as number)
          }
        })
        return cleaned
      })

      return cleanedData
    }

    const totalBalanceFormatted = formatCurrency({
      toNumber: () => totalBalance,
    })

    const balanceEvolutionResult = await generateBalanceEvolution()
    const spendingByCategory = generateSpendingByCategory()

    return {
      totalBalance,
      totalBalanceFormatted,
      bankBalance,
      investmentBalance,
      balanceEvolution: balanceEvolutionResult.data,
      movingAverages: balanceEvolutionResult.movingAverages,
      spendingByCategory,
    }
  } catch (error) {
    console.error('Error loading accounts:', error)
    return {
      totalBalance: 0,
      totalBalanceFormatted: 'R$ 0,00',
      bankBalance: 0,
      investmentBalance: 0,
      balanceEvolution: [],
      movingAverages: {
        totalMonthlyIncome: 0,
        totalMonthlySpending: 0,
        expectedSavings: 0,
      },
      spendingByCategory: [],
    }
  }
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
    </div>
  )
}
