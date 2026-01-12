import { useMemo, useSyncExternalStore } from 'react'
import type { CategoryId, CategoryName } from '../../domain/Categories'
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

export { excludedCategories }

/**
 * Hook to compute dashboard data from local store.
 * Returns the same shape as the original useDashboardData for backwards compatibility.
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
    const movingAverages = localStore.getMovingAverages()

    const bankBalance = accounts
      .filter((account) => account.type !== 'CREDIT')
      .reduce((sum, account) => sum + account.balance, 0)

    const investmentBalance = 0

    const totalBalance = bankBalance + investmentBalance

    const balanceEvolution = generateBalanceEvolution(
      bankBalance,
      movingAverages.totalMonthlyIncome - movingAverages.totalMonthlySpending
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
  transactions: ReturnType<typeof localStore.getTransactions>,
  accounts: ReturnType<typeof localStore.getAccounts>
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
