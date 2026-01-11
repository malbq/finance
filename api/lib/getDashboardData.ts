import { asc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { CategoryId, CategoryName } from '../../domain/Categories'
import { formatCurrency } from '../../utils/formatCurrency'
import {
  accounts,
  bankData,
  creditData,
  investments,
  movingAverageProjections,
  transactions,
} from '../db/schema'

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

type Db = ReturnType<typeof drizzle>

export async function getDashboardData(db: Db): Promise<DashboardData> {
  try {
    const accountsData = await loadAccounts(db)
    const transactionsData = await loadTransactions(db)
    const investmentsData = await loadInvestments(db)
    const bankBalance = accountsData
      .filter((account) => account.type !== 'CREDIT')
      .reduce((sum, account) => sum + account.balance, 0)
    const investmentBalance = investmentsData.reduce(
      (sum, investment) => sum + investment.balance,
      0
    )
    const balanceEvolutionResult = await generateBalanceEvolution(db, accountsData)
    const spendingByCategory = generateSpendingByCategory(transactionsData)
    const totalBalance = bankBalance + investmentBalance

    return {
      totalBalance,
      totalBalanceFormatted: formatCurrency(totalBalance),
      bankBalance,
      investmentBalance,
      balanceEvolution: balanceEvolutionResult.data,
      movingAverages: balanceEvolutionResult.movingAverages,
      spendingByCategory,
    }
  } catch {
    console.error('Error loading dashboard data')
    return getEmptyDashboardData()
  }
}

async function loadAccounts(db: Db) {
  const result = await db
    .select()
    .from(accounts)
    .leftJoin(bankData, eq(accounts.id, bankData.accountId))
    .leftJoin(creditData, eq(accounts.id, creditData.accountId))
    .orderBy(accounts.name)

  return result.map((row) => ({
    ...row.Account,
    balance: row.Account.balance,
    bankData: row.BankData || undefined,
    creditData: row.CreditData || undefined,
  }))
}

async function loadTransactions(db: Db) {
  const now = new Date()
  const upperDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const lowerDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const lowerTimestamp = lowerDate.getTime()
  const upperTimestamp = upperDate.getTime()

  const excludedCategories = new Set([
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
  ])

  const rawResults = await db
    .select({
      transaction: transactions,
      account: { type: accounts.type },
      dateRaw: sql<number>`CAST(${transactions.date} AS INTEGER)`.as('dateRaw'),
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(isNotNull(transactions.categoryId))
    .orderBy(asc(transactions.date))

  const afterDateMapping = rawResults
    .map((row) => {
      const txDate =
        typeof (row as any).dateRaw === 'number'
          ? (row as any).dateRaw
          : typeof row.transaction.date === 'number'
          ? row.transaction.date
          : null

      if (txDate === null) {
        return null
      }

      if (isNaN(txDate) || txDate < 0 || txDate > 4102444800000) {
        return null
      }

      return {
        transaction: row.transaction,
        account: row.account,
        txDate,
      }
    })
    .filter((row): row is NonNullable<typeof row> => {
      if (!row) return false

      const txDate = row.txDate
      if (txDate < lowerTimestamp || txDate >= upperTimestamp) {
        return false
      }

      const categoryId = row.transaction.categoryId
      if (!categoryId) return false

      if (excludedCategories.has(categoryId)) {
        return (
          row.account?.type === 'BANK' &&
          row.transaction.type === 'CREDIT' &&
          categoryId === '01010000'
        )
      }

      return true
    })
    .map((row) => {
      const date = new Date(row.txDate)
      return {
        ...row.transaction,
        date,
        account: row.account,
        categoryId: row.transaction.categoryId as CategoryId,
        category: row.transaction.category as CategoryName,
        amount: row.transaction.amount,
      }
    })

  return afterDateMapping
}

async function loadInvestments(db: Db) {
  const result = await db
    .select()
    .from(investments)
    .where(inArray(investments.status, ['ACTIVE']))

  return result.map((investment) => ({
    ...investment,
    balance: investment.balance,
  }))
}

async function generateBalanceEvolution(
  db: Db,
  accounts: Awaited<ReturnType<typeof loadAccounts>>
) {
  const currentDate = new Date()
  const data = []

  const bankAccounts = accounts.filter((account) => account.type === 'BANK')
  let currentBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0)

  const projections = await db.select().from(movingAverageProjections)

  const spendingProjection = projections.find((p) => p.category === 'Spending')
  const totalMonthlySpending = spendingProjection?.value || 0

  const incomeProjection = projections.find((p) => p.category === 'Income')
  const totalMonthlyIncome = incomeProjection?.value || 0

  const monthlyProjectedSavings = totalMonthlyIncome - totalMonthlySpending

  for (let i = 1; i <= 24; i++) {
    const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
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

function generateSpendingByCategory(
  transactions: Awaited<ReturnType<typeof loadTransactions>>
): DashboardData['spendingByCategory'] {
  const data: Map<string, DashboardData['spendingByCategory'][number]> = new Map()

  transactions.forEach((transaction) => {
    const { date, categoryId, amount, account, type } = transaction

    if (!account) {
      return
    }

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

    if (account && account.type === 'BANK' && type === 'CREDIT' && categoryId === '01010000') {
      monthData.salary += normalizedAmount
      return
    }

    monthData.total -= normalizedAmount
    const catId = categoryId as CategoryId
    monthData[catId] = (monthData[catId] || 0) - normalizedAmount
  })

  const result = Array.from(data.values()).map((monthData) => ({
    ...monthData,
  }))

  return result
}

function getEmptyDashboardData(): DashboardData {
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
