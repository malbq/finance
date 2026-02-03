import { describe, expect, test } from 'bun:test'
import type { BootstrapData } from '../../api/bootstrap'
import type { Account } from '../../domain/Account'
import type { Transaction } from '../../domain/Transaction'

/**
 * Tests for localStore delta merge behavior.
 * Uses a simplified in-memory store to test the merge logic.
 */

interface TestStoreState {
  accounts: Map<string, Account>
  transactions: Map<string, Transaction>
  bootstrapCursor: number | null
}

function createTestStore() {
  const state: TestStoreState = {
    accounts: new Map(),
    transactions: new Map(),
    bootstrapCursor: null,
  }

  return {
    hydrateFull(data: BootstrapData): void {
      state.accounts.clear()
      for (const account of data.accounts) {
        state.accounts.set(account.id, account)
      }

      state.transactions.clear()
      for (const transaction of data.transactions) {
        state.transactions.set(transaction.id, transaction)
      }

      state.bootstrapCursor = data.cursor
    },

    applyDelta(data: BootstrapData): void {
      // Update accounts (full replace)
      state.accounts.clear()
      for (const account of data.accounts) {
        state.accounts.set(account.id, account)
      }

      // Upsert transactions (do NOT clear existing)
      for (const transaction of data.transactions) {
        state.transactions.set(transaction.id, transaction)
      }

      state.bootstrapCursor = data.cursor
    },

    getTransactions(): Transaction[] {
      return Array.from(state.transactions.values())
    },

    getAccounts(): Account[] {
      return Array.from(state.accounts.values())
    },

    getCursor(): number | null {
      return state.bootstrapCursor
    },
  }
}

function createMockTransaction(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    accountId: 'account-1',
    description: `Transaction ${id}`,
    currencyCode: 'BRL',
    amount: -100,
    amountFormatted: 'R$ -100,00',
    date: new Date('2025-01-01'),
    dateFormatted: '01/01/2025',
    timeFormatted: '12:00',
    futurePayment: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

function createMockAccount(id: string, overrides: Partial<Account> = {}): Account {
  return {
    id,
    type: 'BANK',
    name: `Account ${id}`,
    balance: 1000,
    balanceFormatted: 'R$ 1.000,00',
    currencyCode: 'BRL',
    ...overrides,
  }
}

describe('LocalStore Delta Merge', () => {
  test('hydrateFull clears and replaces all data', () => {
    const store = createTestStore()

    // First hydration
      store.hydrateFull({
        accounts: [createMockAccount('a1'), createMockAccount('a2')],
        transactions: [createMockTransaction('tx1'), createMockTransaction('tx2')],
        spendingGoals: {},
        cursor: 1000,
        isDelta: false,
      })


    expect(store.getTransactions().length).toBe(2)
    expect(store.getAccounts().length).toBe(2)
    expect(store.getCursor()).toBe(1000)

    // Second hydration should clear and replace
      store.hydrateFull({
        accounts: [createMockAccount('a3')],
        transactions: [createMockTransaction('tx3')],
        spendingGoals: {},
        cursor: 2000,
        isDelta: false,
      })


    expect(store.getTransactions().length).toBe(1)
    expect(store.getTransactions()[0]!.id).toBe('tx3')
    expect(store.getAccounts().length).toBe(1)
    expect(store.getCursor()).toBe(2000)
  })

  test('applyDelta upserts transactions without clearing existing', () => {
    const store = createTestStore()

    // Initial full hydration
    store.hydrateFull({
      accounts: [createMockAccount('a1')],
      transactions: [
        createMockTransaction('tx1', { description: 'Original 1' }),
        createMockTransaction('tx2', { description: 'Original 2' }),
        createMockTransaction('tx3', { description: 'Original 3' }),
      ],
      spendingGoals: {},
      cursor: 1000,
      isDelta: false,
    })

    expect(store.getTransactions().length).toBe(3)

    // Apply delta with one update and one new transaction
    store.applyDelta({
      accounts: [createMockAccount('a1', { balance: 2000 })],
      transactions: [
        createMockTransaction('tx2', { description: 'Updated 2' }),
        createMockTransaction('tx4', { description: 'New 4' }),
      ],
      spendingGoals: {},
      cursor: 2000,
      isDelta: true,
    })

    // Should have 4 transactions total (3 original + 1 new, with tx2 updated)
    expect(store.getTransactions().length).toBe(4)

    const tx1 = store.getTransactions().find((t) => t.id === 'tx1')
    const tx2 = store.getTransactions().find((t) => t.id === 'tx2')
    const tx3 = store.getTransactions().find((t) => t.id === 'tx3')
    const tx4 = store.getTransactions().find((t) => t.id === 'tx4')

    expect(tx1!.description).toBe('Original 1')
    expect(tx2!.description).toBe('Updated 2') // Updated
    expect(tx3!.description).toBe('Original 3')
    expect(tx4!.description).toBe('New 4') // New

    expect(store.getCursor()).toBe(2000)
  })

  test('applyDelta with empty transactions does not wipe existing', () => {
    const store = createTestStore()

    // Initial hydration
    store.hydrateFull({
      accounts: [createMockAccount('a1')],
      transactions: [createMockTransaction('tx1'), createMockTransaction('tx2')],
      spendingGoals: {},
      cursor: 1000,
      isDelta: false,
    })

    expect(store.getTransactions().length).toBe(2)

    // Apply delta with no transactions (nothing changed)
    store.applyDelta({
      accounts: [createMockAccount('a1')],
      transactions: [],
      spendingGoals: {},
      cursor: 2000,
      isDelta: true,
    })

    // All original transactions should still be there
    expect(store.getTransactions().length).toBe(2)
    expect(store.getCursor()).toBe(2000)
  })

  test('accounts are fully replaced on both hydrateFull and applyDelta', () => {
    const store = createTestStore()

    // Initial hydration
    store.hydrateFull({
      accounts: [createMockAccount('a1'), createMockAccount('a2')],
      transactions: [],
      spendingGoals: {},
      cursor: 1000,
      isDelta: false,
    })

    expect(store.getAccounts().length).toBe(2)

    // Apply delta with different accounts
    store.applyDelta({
      accounts: [createMockAccount('a1'), createMockAccount('a3')],
      transactions: [],
      spendingGoals: {},
      cursor: 2000,
      isDelta: true,
    })

    // Accounts should be fully replaced
    expect(store.getAccounts().length).toBe(2)
    const accountIds = store.getAccounts().map((a) => a.id)
    expect(accountIds).toContain('a1')
    expect(accountIds).toContain('a3')
    expect(accountIds).not.toContain('a2')
  })
})
