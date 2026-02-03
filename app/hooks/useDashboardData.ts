import { useMemo, useSyncExternalStore } from 'react'
import type { Account } from '../../domain/Account'
import type { CategoryId } from '../../domain/Categories'
import type { Transaction } from '../../domain/Transaction'
import { formatCurrency } from '../../utils/formatCurrency'
import { localStore } from '../lib/localStore'
import { useBootstrapQuery } from './useBootstrapQuery'

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

/** Categories excluded from spending calculations (income, transfers, etc.) */
const excludedCategories = new Set([
  '01000000', // Income (parent)
  '01010000', // Salary
  '01020000', // Other income
  '01030000', // Investments income
  '01040000', // Bonus
  '01050000', // Refund
  '03000000', // Transfers (parent)
  '03010000', // Transfer in
  '03020000', // Transfer out
  '03030000', // PIX in
  '03040000', // PIX out
  '03050000', // TED/DOC
  '03060000', // Payment
  '03070000', // Credit card payment
  '04000000', // Investments
  '05100000', // Credit card bill
  '12',       // Uncategorized
])

export { excludedCategories }

/**
 * Hook to compute dashboard data from local store.
 * All data is computed client-side from in-memory transactions.
 */
export function useDashboardData() {
  const bootstrapQuery = useBootstrapQuery()

  const snapshot = useSyncExternalStore(
    (callback) => localStore.subscribe(callback),
    () => localStore.getSnapshot()
  )

  const data = useMemo<DashboardData | undefined>(() => {
    if (!localStore.isHydrated()) return undefined

    const accounts = localStore.getAccounts()
    const transactions = localStore.getTransactions()

    const bankBalance = accounts
      .filter((account) => account.type !== 'CREDIT')
      .reduce((sum, account) => sum + account.balance, 0)

    const investmentBalance = 0

    const totalBalance = bankBalance + investmentBalance

    // Compute moving averages from transactions
    const movingAverages = computeMovingAverages(transactions, accounts)

    const balanceEvolution = generateBalanceEvolution(
      bankBalance,
      movingAverages.expectedSavings
    )

    const spendingByCategory = generateSpendingByCategory(transactions, accounts)

    return {
      totalBalance,
      totalBalanceFormatted: formatCurrency(totalBalance),
      bankBalance,
      investmentBalance,
      balanceEvolution,
      movingAverages,
      spendingByCategory,
    }
  }, [snapshot])

  return {
    data,
    isLoading: bootstrapQuery.isLoading,
    isError: bootstrapQuery.isError,
    error: bootstrapQuery.error,
    isPending: bootstrapQuery.isPending,
    refetch: bootstrapQuery.refetch,
  }
}

/**
 * Compute moving averages for income and spending from transactions.
 * Uses a 3-month rolling average of completed months.
 */
function computeMovingAverages(
  transactions: Transaction[],
  accounts: Account[]
): DashboardData['movingAverages'] {
  const accountTypeMap = new Map(accounts.map((a) => [a.id, a.type]))

  // Group transactions by month
  const monthlyTotals = new Map<string, { income: number; spending: number }>()

  for (const tx of transactions) {
    const accountType = accountTypeMap.get(tx.accountId)
    if (!accountType || !tx.categoryId) continue

    const txDate = new Date(tx.date)
    // Use YYYY-MM format for proper sorting
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyTotals.has(monthKey)) {
      monthlyTotals.set(monthKey, { income: 0, spending: 0 })
    }
    const month = monthlyTotals.get(monthKey)!

    // Check if this is salary/income
    const isSalary =
      accountType === 'BANK' && tx.type === 'CREDIT' && tx.categoryId === '01010000'

    if (isSalary) {
      month.income += tx.amount
      continue
    }

    // Skip excluded categories for spending
    if (excludedCategories.has(tx.categoryId)) continue

    // Spending (negative amounts represent spending, so negate)
    month.spending += Math.abs(tx.amount < 0 ? tx.amount : -tx.amount)
  }

  // Get the last 3 complete months (exclude current month)
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const completedMonths = Array.from(monthlyTotals.entries())
    .filter(([key]) => key < currentMonthKey)
    .sort((a, b) => b[0].localeCompare(a[0])) // Sort descending
    .slice(0, 3) // Take last 3 months

  if (completedMonths.length === 0) {
    return {
      totalMonthlyIncome: 0,
      totalMonthlySpending: 0,
      expectedSavings: 0,
    }
  }

  const totalIncome = completedMonths.reduce((sum, [, m]) => sum + m.income, 0)
  const totalSpending = completedMonths.reduce((sum, [, m]) => sum + m.spending, 0)
  const monthCount = completedMonths.length

  const totalMonthlyIncome = totalIncome / monthCount
  const totalMonthlySpending = totalSpending / monthCount
  const expectedSavings = totalMonthlyIncome - totalMonthlySpending

  return {
    totalMonthlyIncome,
    totalMonthlySpending,
    expectedSavings,
  }
}

function generateBalanceEvolution(
  currentBalance: number,
  monthlyProjectedSavings: number
): DashboardData['balanceEvolution'] {
  const currentDate = new Date()
  const data: DashboardData['balanceEvolution'] = []
  let balance = currentBalance

  for (let i = 1; i <= 24; i++) {
    const futureDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + i, 1))
    const monthName = new Intl.DateTimeFormat('pt-BR', {
      month: '2-digit',
      year: '2-digit',
      timeZone: 'UTC',
    }).format(futureDate)

    balance += monthlyProjectedSavings

    data.push({
      month: monthName,
      balance,
    })
  }

  return data
}

function generateSpendingByCategory(
  transactions: Transaction[],
  accounts: Account[]
): DashboardData['spendingByCategory'] {
  const accountTypeMap = new Map(accounts.map((a) => [a.id, a.type]))

  const data: Map<string, DashboardData['spendingByCategory'][number]> = new Map()

  for (const transaction of transactions) {
    const { date, categoryId, amount, accountId, type } = transaction
    const accountType = accountTypeMap.get(accountId)

    if (!accountType || !categoryId) continue

    if (excludedCategories.has(categoryId)) {
      const isSalary =
        accountType === 'BANK' && type === 'CREDIT' && categoryId === '01010000'
      if (!isSalary) continue
    }

    const txDate = new Date(date)
    const monthKey = new Intl.DateTimeFormat('pt-BR', {
      month: '2-digit',
      year: '2-digit',
      timeZone: 'UTC',
    }).format(txDate)

    if (!data.has(monthKey)) {
      data.set(monthKey, {
        month: monthKey,
        total: 0,
        salary: 0,
      })
    }
    const monthData = data.get(monthKey)!

    if (accountType === 'BANK' && type === 'CREDIT' && categoryId === '01010000') {
      monthData.salary += amount
      continue
    }

    monthData.total -= amount
    const catId = categoryId as CategoryId
    monthData[catId] = (monthData[catId] || 0) - amount
  }

  return Array.from(data.values()).sort((a, b) => monthKeyToIndex(a.month) - monthKeyToIndex(b.month))
}

function monthKeyToIndex(monthKey: string): number {
  const [mmStr, yyStr] = monthKey.split('/')
  const mm = Number(mmStr)
  const yy = Number(yyStr)
  if (!Number.isFinite(mm) || !Number.isFinite(yy)) return 0
  return (2000 + yy) * 12 + (mm - 1)
}
