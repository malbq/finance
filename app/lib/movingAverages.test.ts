import { describe, expect, test } from 'bun:test'
import type { Account } from '../../domain/Account'
import type { Transaction } from '../../domain/Transaction'

/**
 * Tests for client-side moving average computation.
 * This mirrors the logic in useDashboardData.ts
 */

/** Categories excluded from spending calculations */
const excludedCategories = new Set([
  '01000000', '01010000', '01020000', '01030000', '01040000', '01050000',
  '03000000', '03010000', '03020000', '03030000', '03040000', '03050000',
  '03060000', '03070000', '04000000', '05100000', '12',
])

interface MovingAverages {
  totalMonthlyIncome: number
  totalMonthlySpending: number
  expectedSavings: number
}

/**
 * Compute moving averages for income and spending from transactions.
 * Uses a 3-month rolling average of completed months.
 */
function computeMovingAverages(
  transactions: Transaction[],
  accounts: Account[]
): MovingAverages {
  const accountTypeMap = new Map(accounts.map((a) => [a.id, a.type]))
  const monthlyTotals = new Map<string, { income: number; spending: number }>()

  for (const tx of transactions) {
    const accountType = accountTypeMap.get(tx.accountId)
    if (!accountType || !tx.categoryId) continue

    const txDate = new Date(tx.date)
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyTotals.has(monthKey)) {
      monthlyTotals.set(monthKey, { income: 0, spending: 0 })
    }
    const month = monthlyTotals.get(monthKey)!

    const isSalary =
      accountType === 'BANK' && tx.type === 'CREDIT' && tx.categoryId === '01010000'

    if (isSalary) {
      month.income += tx.amount
      continue
    }

    if (excludedCategories.has(tx.categoryId)) continue
    month.spending += Math.abs(tx.amount < 0 ? tx.amount : -tx.amount)
  }

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const completedMonths = Array.from(monthlyTotals.entries())
    .filter(([key]) => key < currentMonthKey)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 3)

  if (completedMonths.length === 0) {
    return { totalMonthlyIncome: 0, totalMonthlySpending: 0, expectedSavings: 0 }
  }

  const totalIncome = completedMonths.reduce((sum, [, m]) => sum + m.income, 0)
  const totalSpending = completedMonths.reduce((sum, [, m]) => sum + m.spending, 0)
  const monthCount = completedMonths.length

  const totalMonthlyIncome = totalIncome / monthCount
  const totalMonthlySpending = totalSpending / monthCount
  const expectedSavings = totalMonthlyIncome - totalMonthlySpending

  return { totalMonthlyIncome, totalMonthlySpending, expectedSavings }
}

function createMockTransaction(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: 'bank-1',
    description: `Transaction ${id}`,
    currencyCode: 'BRL',
    amount: -100,
    amountFormatted: 'R$ -100,00',
    date: new Date(),
    dateFormatted: '01/01/2025',
    timeFormatted: '12:00',
    futurePayment: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockAccount(id: string, type: 'BANK' | 'CREDIT' = 'BANK'): Account {
  return {
    id,
    type,
    name: `Account ${id}`,
    balance: 1000,
    balanceFormatted: 'R$ 1.000,00',
    currencyCode: 'BRL',
  }
}

describe('Moving Average Computation', () => {
  test('computes average from completed months only', () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15)

    const accounts = [createMockAccount('bank-1')]
    const transactions: Transaction[] = [
      // Salary last month
      createMockTransaction('tx1', {
        date: lastMonth,
        amount: 5000,
        type: 'CREDIT',
        categoryId: '01010000',
      }),
      // Spending last month (negative amount = spending)
      createMockTransaction('tx2', {
        date: lastMonth,
        amount: -2000,
        type: 'DEBIT',
        categoryId: '02010000', // Some spending category
      }),
      // Salary two months ago
      createMockTransaction('tx3', {
        date: twoMonthsAgo,
        amount: 5000,
        type: 'CREDIT',
        categoryId: '01010000',
      }),
      // Spending two months ago
      createMockTransaction('tx4', {
        date: twoMonthsAgo,
        amount: -3000,
        type: 'DEBIT',
        categoryId: '02010000',
      }),
    ]

    const result = computeMovingAverages(transactions, accounts)

    // Average of 2 months: (5000 + 5000) / 2 = 5000
    expect(result.totalMonthlyIncome).toBe(5000)
    // Average of 2 months: (2000 + 3000) / 2 = 2500
    expect(result.totalMonthlySpending).toBe(2500)
    // Expected savings
    expect(result.expectedSavings).toBe(2500)
  })

  test('excludes current month from averages', () => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)

    const accounts = [createMockAccount('bank-1')]
    const transactions: Transaction[] = [
      // Salary this month (should be excluded)
      createMockTransaction('tx1', {
        date: thisMonth,
        amount: 10000,
        type: 'CREDIT',
        categoryId: '01010000',
      }),
      // Salary last month
      createMockTransaction('tx2', {
        date: lastMonth,
        amount: 5000,
        type: 'CREDIT',
        categoryId: '01010000',
      }),
    ]

    const result = computeMovingAverages(transactions, accounts)

    // Only last month should count
    expect(result.totalMonthlyIncome).toBe(5000)
  })

  test('excludes transfer categories from spending', () => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const accounts = [createMockAccount('bank-1')]
    const transactions: Transaction[] = [
      // Transfer out (should be excluded)
      createMockTransaction('tx1', {
        date: lastMonth,
        amount: -1000,
        type: 'DEBIT',
        categoryId: '03040000', // PIX out
      }),
      // Regular spending
      createMockTransaction('tx2', {
        date: lastMonth,
        amount: -500,
        type: 'DEBIT',
        categoryId: '02010000',
      }),
    ]

    const result = computeMovingAverages(transactions, accounts)

    // Only the regular spending should count
    expect(result.totalMonthlySpending).toBe(500)
  })

  test('returns zeros when no completed months', () => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15)

    const accounts = [createMockAccount('bank-1')]
    const transactions: Transaction[] = [
      createMockTransaction('tx1', {
        date: thisMonth,
        amount: 5000,
        type: 'CREDIT',
        categoryId: '01010000',
      }),
    ]

    const result = computeMovingAverages(transactions, accounts)

    expect(result.totalMonthlyIncome).toBe(0)
    expect(result.totalMonthlySpending).toBe(0)
    expect(result.expectedSavings).toBe(0)
  })

  test('uses at most 3 months for average', () => {
    const accounts = [createMockAccount('bank-1')]
    const transactions: Transaction[] = []

    // Create 5 months of data
    for (let i = 1; i <= 5; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)

      transactions.push(
        createMockTransaction(`salary-${i}`, {
          date,
          amount: 1000 * i, // 1000, 2000, 3000, 4000, 5000
          type: 'CREDIT',
          categoryId: '01010000',
        })
      )
    }

    const result = computeMovingAverages(transactions, accounts)

    // Should use only last 3 months: (1000 + 2000 + 3000) / 3 = 2000
    expect(result.totalMonthlyIncome).toBe(2000)
  })
})
