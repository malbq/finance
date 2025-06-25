import { PrismaClient } from '@prisma-app/client'
import { formatCurrency } from '../../utils/formatCurrency'

export interface DashboardData {
  totalBalance: number
  totalBalanceFormatted: string
  bankBalance: number
  investmentBalance: number
  balanceEvolution: Array<{
    month: string
    balance: number
  }>
  movingAverages: {
    totalMonthlyIncome: number
    totalMonthlySpending: number
    expectedSavings: number
  }
  spendingByCategory: Array<{
    month: string
    [category: string]: string | number
  }>
}

export class GetDashboardData {
  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<DashboardData> {
    try {
      const categories = await this.loadCategories()
      const categoryMap = new Map(
        categories.map((cat) => [cat.id, cat.descriptionTranslated])
      )

      const accounts = await this.loadAccounts()
      const investments = await this.loadInvestments()

      const bankBalance = accounts
        .filter((account) => account.type !== 'CREDIT')
        .reduce(
          (sum, account) => sum + this.getBalanceValue(account.balance),
          0
        )

      const investmentBalance = investments.reduce(
        (sum, investment) => sum + this.getBalanceValue(investment.balance),
        0
      )

      const totalBalance = bankBalance + investmentBalance

      const balanceEvolutionResult = await this.generateBalanceEvolution(
        accounts
      )
      const spendingByCategory = this.generateSpendingByCategory(
        accounts,
        categoryMap
      )

      return {
        totalBalance,
        totalBalanceFormatted: formatCurrency({ toNumber: () => totalBalance }),
        bankBalance,
        investmentBalance,
        balanceEvolution: balanceEvolutionResult.data,
        movingAverages: balanceEvolutionResult.movingAverages,
        spendingByCategory,
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      if (error instanceof Error) {
        console.error('Dashboard error details:', {
          message: error.message,
          stack: error.stack,
        })
      }
      return this.getEmptyDashboardData()
    }
  }

  private async loadCategories() {
    return await this.prisma.category.findMany()
  }

  private async loadAccounts() {
    return await this.prisma.account.findMany({
      include: {
        bankData: true,
        creditData: true,
        transactions: {
          where: {
            categoryId: {
              notIn: ['03000000', '04000000', '05100000', '12'],
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
  }

  private async loadInvestments() {
    return await this.prisma.investment.findMany({
      where: {
        status: {
          in: ['ACTIVE'],
        },
      },
    })
  }

  private getBalanceValue(balance: any): number {
    if (balance === null || balance === undefined) return 0
    const value =
      typeof balance.toNumber === 'function'
        ? balance.toNumber()
        : parseFloat(balance.toString())
    return isNaN(value) ? 0 : value
  }

  private getTranslatedCategory(
    categoryId: string | null,
    fallbackCategory: string | null,
    categoryMap: Map<string, string>
  ): string | null {
    if (categoryId && categoryMap.has(categoryId)) {
      return categoryMap.get(categoryId)!
    }
    return fallbackCategory
  }

  private applyTimezoneOffset(date: Date): Date {
    const offsetHours = -3
    const offsetMs = offsetHours * 60 * 60 * 1000
    return new Date(date.getTime() + offsetMs)
  }

  private getMonthKeyWithOffset(date: Date): string {
    const adjustedDate = this.applyTimezoneOffset(date)
    const monthStart = new Date(
      adjustedDate.getFullYear(),
      adjustedDate.getMonth(),
      1
    )
    return monthStart.toISOString().slice(0, 7)
  }

  private async generateBalanceEvolution(accounts: any[]) {
    const currentDate = new Date()
    const data = []

    const bankAccounts = accounts.filter((account) => account.type === 'BANK')
    let currentBalance = bankAccounts.reduce(
      (sum, account) => sum + this.getBalanceValue(account.balance),
      0
    )

    const latestSpendingProjections = (await this.prisma.$queryRawUnsafe(`
      SELECT category, moving_avg_6_months
      FROM category_spending_moving_average 
      WHERE moving_avg_6_months IS NOT NULL
    `)) as Array<{ category: string; moving_avg_6_months: number }>

    const latestIncomeProjections = (await this.prisma.$queryRawUnsafe(`
      SELECT category, moving_avg_6_months
      FROM category_income_moving_average 
      WHERE moving_avg_6_months IS NOT NULL
    `)) as Array<{ category: string; moving_avg_6_months: number }>

    const totalMonthlySpending = latestSpendingProjections.reduce(
      (sum, projection) => sum + (projection.moving_avg_6_months || 0),
      0
    )

    const totalMonthlyIncome = latestIncomeProjections.reduce(
      (sum, projection) => sum + (projection.moving_avg_6_months || 0),
      0
    )

    const monthlyProjectedSavings = totalMonthlyIncome - totalMonthlySpending

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

  private generateSpendingByCategory(
    accounts: any[],
    categoryMap: Map<string, string>
  ) {
    const data: Array<{
      month: string
      [category: string]: string | number
    }> = []

    const bankAccounts = accounts.filter((account) => account.type === 'BANK')
    const creditCards = accounts.filter((account) => account.type === 'CREDIT')

    const spendingTransactions = [
      ...bankAccounts.flatMap((account) =>
        account.transactions
          .filter((t: any) => {
            const amount = this.getBalanceValue(t.amount)
            return t.type === 'DEBIT' && amount !== 0
          })
          .map((t: any) => ({
            ...t,
            amount: Math.abs(this.getBalanceValue(t.amount)),
          }))
      ),
      ...creditCards.flatMap((account) =>
        account.transactions
          .filter((t: any) => {
            const amount = this.getBalanceValue(t.amount)
            return t.type === 'DEBIT' && amount !== 0
          })
          .map((t: any) => ({
            ...t,
            amount: Math.abs(this.getBalanceValue(t.amount)),
          }))
      ),
    ]

    const incomeTransactions = bankAccounts.flatMap((account) =>
      account.transactions
        .filter((t: any) => t.type === 'CREDIT' && t.categoryId === '01010000')
        .map((t: any) => ({
          ...t,
          amount: Math.abs(this.getBalanceValue(t.amount)),
        }))
    )

    if (spendingTransactions.length === 0) {
      return []
    }

    const allCategoryTotals: Record<string, number> = {}
    spendingTransactions.forEach((transaction) => {
      const category =
        this.getTranslatedCategory(
          transaction.categoryId,
          transaction.category,
          categoryMap
        ) || 'Outros'
      const amount = Math.abs(transaction.amount)
      allCategoryTotals[category] = (allCategoryTotals[category] || 0) + amount
    })

    const allCategories = Object.entries(allCategoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category)

    const currentDate = new Date()
    const twelveMonthsAgo = new Date(currentDate)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const filteredTransactions = spendingTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      return (
        transactionDate >= twelveMonthsAgo && transactionDate <= currentDate
      )
    })

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
      const monthKey = this.getMonthKeyWithOffset(transactionDate)

      if (!monthsWithData.has(monthKey)) {
        monthsWithData.set(monthKey, [])
      }
      monthsWithData.get(monthKey)!.push(transaction)
    })

    filteredIncomeTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date)
      const monthKey = this.getMonthKeyWithOffset(transactionDate)

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
          this.getTranslatedCategory(
            transaction.categoryId,
            transaction.category,
            categoryMap
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

  private getEmptyDashboardData(): DashboardData {
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
