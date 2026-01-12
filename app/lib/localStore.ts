/**
 * Local-first store for client-side data management.
 * Uses in-memory storage with IndexedDB persistence.
 */

import type { Account } from '../../domain/Account'
import type { Category } from '../../domain/Categories'
import type { Transaction } from '../../domain/Transaction'
import type { BootstrapData } from '../../api/bootstrap'

export interface LocalStoreMeta {
  lastBootstrapAt: number | null
  rangeFrom: number | null
  rangeTo: number | null
}

export interface LocalStoreState {
  accounts: Map<string, Account>
  categories: Map<string, Category>
  transactions: Map<string, Transaction>
  movingAverages: {
    totalMonthlyIncome: number
    totalMonthlySpending: number
    expectedSavings: number
  }
  meta: LocalStoreMeta
}

type Listener = () => void

const DB_NAME = 'finance-local-store'
const DB_VERSION = 1
const STORE_NAME = 'data'

class LocalStore {
  private state: LocalStoreState = {
    accounts: new Map(),
    categories: new Map(),
    transactions: new Map(),
    movingAverages: {
      totalMonthlyIncome: 0,
      totalMonthlySpending: 0,
      expectedSavings: 0,
    },
    meta: {
      lastBootstrapAt: null,
      rangeFrom: null,
      rangeTo: null,
    },
  }

  private listeners: Set<Listener> = new Set()
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor() {
    // Load from IndexedDB on initialization
    this.loadFromIndexedDB()
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })

    return this.dbPromise
  }

  private async loadFromIndexedDB(): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    const getRequest = store.get('state')

    getRequest.onsuccess = () => {
      const savedState = getRequest.result
      if (savedState) {
        this.state = {
          accounts: new Map(savedState.accounts || []),
          categories: new Map(savedState.categories || []),
          transactions: new Map(savedState.transactions || []),
          movingAverages: savedState.movingAverages || {
            totalMonthlyIncome: 0,
            totalMonthlySpending: 0,
            expectedSavings: 0,
          },
          meta: savedState.meta || {
            lastBootstrapAt: null,
            rangeFrom: null,
            rangeTo: null,
          },
        }
        this.notifyListeners()
      }
    }
  }

  private async saveToIndexedDB(): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const serializedState = {
      accounts: Array.from(this.state.accounts.entries()),
      categories: Array.from(this.state.categories.entries()),
      transactions: Array.from(this.state.transactions.entries()),
      movingAverages: this.state.movingAverages,
      meta: this.state.meta,
    }

    store.put(serializedState, 'state')
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Hydrate the store from bootstrap data
   */
  hydrate(data: BootstrapData): void {
    // Clear and repopulate accounts
    this.state.accounts.clear()
    for (const account of data.accounts) {
      this.state.accounts.set(account.id, account)
    }

    // Clear and repopulate categories
    this.state.categories.clear()
    for (const category of data.categories) {
      this.state.categories.set(category.id, category)
    }

    // Clear and repopulate transactions
    this.state.transactions.clear()
    for (const transaction of data.transactions) {
      this.state.transactions.set(transaction.id, transaction)
    }

    // Update moving averages
    this.state.movingAverages = data.movingAverages

    // Update meta
    this.state.meta = {
      lastBootstrapAt: data.generatedAt,
      rangeFrom: data.range.from,
      rangeTo: data.range.to,
    }

    this.saveToIndexedDB()
    this.notifyListeners()
  }

  /**
   * Update a single transaction (for optimistic updates)
   */
  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const existing = this.state.transactions.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.state.transactions.set(id, updated)

    this.saveToIndexedDB()
    this.notifyListeners()

    return updated
  }

  /**
   * Get all accounts
   */
  getAccounts(): Account[] {
    return Array.from(this.state.accounts.values())
  }

  /**
   * Get all categories
   */
  getCategories(): Category[] {
    return Array.from(this.state.categories.values())
  }

  /**
   * Get all transactions
   */
  getTransactions(): Transaction[] {
    return Array.from(this.state.transactions.values())
  }

  /**
   * Get a single transaction by ID
   */
  getTransaction(id: string): Transaction | undefined {
    return this.state.transactions.get(id)
  }

  /**
   * Get transactions for a specific account
   */
  getTransactionsByAccount(accountId: string): Transaction[] {
    return this.getTransactions().filter((tx) => tx.accountId === accountId)
  }

  /**
   * Get moving averages
   */
  getMovingAverages() {
    return this.state.movingAverages
  }

  /**
   * Get store metadata
   */
  getMeta(): LocalStoreMeta {
    return this.state.meta
  }

  /**
   * Check if store has been hydrated
   */
  isHydrated(): boolean {
    return this.state.meta.lastBootstrapAt !== null
  }

  /**
   * Get snapshot for React useSyncExternalStore
   */
  getSnapshot(): LocalStoreState {
    return this.state
  }
}

// Singleton instance
export const localStore = new LocalStore()
