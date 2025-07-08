import { PrismaClient } from '@prisma-app/client'
import type {
  CategoryId,
  CategoryName,
} from '~/domain/transactions/entities/Categories'
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
  spendingByCategory: Array<
    {
      month: string
      total: number
      salary: number
    } & {
      [categoryId in CategoryId]?: number
    }
  >
}

export class GetDashboardData {
  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<DashboardData> {
    try {
      const accounts = await this.loadAccounts()
      const transactions = await this.loadTransactions()
      const investments = await this.loadInvestments()

      const bankBalance = accounts
        .filter((account) => account.type !== 'CREDIT')
        .reduce((sum, account) => sum + account.balance, 0)

      const investmentBalance = investments.reduce(
        (sum, investment) => sum + investment.balance,
        0
      )

      const totalBalance = bankBalance + investmentBalance

      const balanceEvolutionResult = await this.generateBalanceEvolution(
        accounts
      )
      const spendingByCategory = this.generateSpendingByCategory(transactions)

      return {
        totalBalance,
        totalBalanceFormatted: formatCurrency(totalBalance),
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

  private async loadAccounts() {
    const accounts = await this.prisma.account.findMany({
      include: {
        bankData: true,
        creditData: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    return accounts.map((account) => ({
      ...account,
      balance: account.balance.toNumber(),
    }))
  }

  private async loadTransactions() {
    const upperDate = new Date()
    upperDate.setMonth(upperDate.getMonth() + 1)
    upperDate.setDate(upperDate.getDate() + 1)
    const lowerDate = new Date(upperDate)
    lowerDate.setMonth(lowerDate.getMonth() - 7)
    lowerDate.setDate(1)
    const transactions = await this.prisma.transaction.findMany({
      include: {
        account: {
          select: {
            type: true,
          },
        },
      },
      where: {
        OR: [
          {
            categoryId: {
              notIn: [
                '01000000',
                '01010000',
                '01020000',
                '01030000',
                '01040000',
                '01050000',
                '03000000',
                '03010000',
                '03020000',
                '03030000',
                '03040000',
                '03050000',
                '03060000',
                '03070000',
                '04000000',
                '05100000',
                '12',
              ],
            },
          },
          {
            account: {
              type: 'BANK',
            },
            type: 'CREDIT',
            categoryId: '01010000',
          },
        ],
        date: {
          gte: lowerDate,
          lte: upperDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })
    return transactions.map((transaction) => ({
      ...transaction,
      categoryId: transaction.categoryId as CategoryId,
      category: transaction.category as CategoryName,
      amount: transaction.amount.toNumber(),
    }))
  }

  private async loadInvestments() {
    const investments = await this.prisma.investment.findMany({
      where: {
        status: {
          in: ['ACTIVE'],
        },
      },
    })
    return investments.map((investment) => ({
      ...investment,
      balance: investment.balance.toNumber(),
    }))
  }

  private async generateBalanceEvolution(accounts: any[]) {
    const currentDate = new Date()
    const data = []

    const bankAccounts = accounts.filter((account) => account.type === 'BANK')
    let currentBalance = bankAccounts.reduce(
      (sum, account) => sum + account.balance,
      0
    )

    const movingAverageProjections = (await this.prisma.$queryRawUnsafe(`
      SELECT category, value
      FROM moving_average_projections 
      WHERE value IS NOT NULL
    `)) as Array<{ category: string; value: number }>

    const totalMonthlySpending =
      movingAverageProjections.find((p) => p.category === 'Spending')?.value ||
      0

    const totalMonthlyIncome =
      movingAverageProjections.find((p) => p.category === 'Income')?.value || 0

    const monthlyProjectedSavings = totalMonthlyIncome - totalMonthlySpending

    for (let i = 1; i <= 24; i++) {
      const futureDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      )
      const monthName = futureDate.toLocaleDateString('pt-BR', {
        month: '2-digit',
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
    transactions: Awaited<ReturnType<typeof this.loadTransactions>>
  ): DashboardData['spendingByCategory'] {
    const data: Map<string, DashboardData['spendingByCategory'][number]> =
      new Map()

    transactions.forEach((transaction) => {
      const { date, categoryId, amount, account, type } = transaction
      const normalizedAmount = account.type === 'BANK' ? amount : amount * -1
      const monthKey = date.toLocaleDateString('pt-BR', {
        month: '2-digit',
        year: '2-digit',
      })

      if (!data.has(monthKey)) {
        data.set(monthKey, {
          month: monthKey,
          total: 0,
          salary: 0,
        })
      }
      const monthData = data.get(monthKey)!

      if (
        account.type === 'BANK' &&
        type === 'CREDIT' &&
        categoryId === '01010000'
      ) {
        monthData.salary += normalizedAmount
        return
      }

      monthData.total -= normalizedAmount
      monthData[categoryId] = (monthData[categoryId] || 0) - normalizedAmount
    })

    return Array.from(data.values()).map((monthData) => ({
      ...monthData,
    }))
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
