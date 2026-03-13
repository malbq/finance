/**
 * Local-first store for client-side data management.
 * Uses in-memory storage with IndexedDB persistence.
 *
 * Categories are static and accessed via CATEGORY_MAP from domain/Categories.
 * Moving averages are computed client-side from transactions.
 */

import type { BootstrapData } from '../../api/bootstrap'
import type { Account } from '../../domain/Account'
import type { CategoryId } from '../../domain/Categories'
import type { Transaction } from '../../domain/Transaction'
import type { Serialized } from '../../utils/Serialized'

/** Wire format of BootstrapData as received from the API (Date fields are strings). */
export type SerializedBootstrapData = Serialized<BootstrapData>

/**
 * Deserialize a Transaction as received via JSON (Date fields are strings)
 * back into a proper Transaction with Date objects.
 */
function deserializeTransaction(tx: Serialized<Transaction>): Transaction {
  return {
    ...tx,
    date: new Date(tx.date),
    createdAt: new Date(tx.createdAt),
    updatedAt: new Date(tx.updatedAt),
    creditCardMetadata: tx.creditCardMetadata
      ? {
          ...tx.creditCardMetadata,
          purchaseDate: tx.creditCardMetadata.purchaseDate
            ? new Date(tx.creditCardMetadata.purchaseDate)
            : undefined,
        }
      : undefined,
  }
}

/**
 * Deserialize an Account as received via JSON (Date fields are strings)
 * back into a proper Account with Date objects.
 */
function deserializeAccount(account: Serialized<Account>): Account {
  return {
    ...account,
    creditData: account.creditData
      ? {
          ...account.creditData,
          balanceDueDate: new Date(account.creditData.balanceDueDate),
        }
      : undefined,
  }
}

type Goal = {
  goal: number | null
  tolerance: number | null
}

type GoalsByCategory = Partial<Record<CategoryId, Goal>>

export interface LocalStoreMeta {
  /** Cursor for delta sync: max Transaction.updatedAt from last bootstrap */
  bootstrapCursor: number | null
}

export interface LocalStoreState {
  accounts: Map<string, Account>
  transactions: Map<string, Transaction>
  spendingGoals: GoalsByCategory
  meta: LocalStoreMeta
}

type Listener = () => void

const DB_NAME = 'finance-local-store'
const DB_VERSION = 2
const STORE_NAME = 'data'

class LocalStore {
  private state: LocalStoreState = {
    accounts: new Map(),
    transactions: new Map(),
    spendingGoals: {},
    meta: {
      bootstrapCursor: null,
    },
  }

  /** Version counter to create new snapshot references on state changes */
  private version = 0
  private cachedSnapshot: LocalStoreState | undefined

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
          transactions: new Map(savedState.transactions || []),
          spendingGoals: savedState.spendingGoals || {},
          meta: {
            bootstrapCursor: savedState.meta?.bootstrapCursor ?? null,
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
      transactions: Array.from(this.state.transactions.entries()),
      spendingGoals: this.state.spendingGoals,
      meta: this.state.meta,
    }

    store.put(serializedState, 'state')
  }

  private notifyListeners(): void {
    // Invalidate cached snapshot so getSnapshot returns a new reference
    this.version++
    this.cachedSnapshot = undefined
    this.listeners.forEach((listener) => listener())
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Full hydration: clear all data and repopulate from bootstrap response.
   * Used when no local cursor exists (fresh load).
   */
  hydrateFull(data: SerializedBootstrapData): void {
    // Clear and repopulate accounts
    this.state.accounts.clear()
    for (const account of data.accounts) {
      this.state.accounts.set(account.id, deserializeAccount(account))
    }

    // Clear and repopulate transactions
    this.state.transactions.clear()
    for (const transaction of data.transactions) {
      this.state.transactions.set(transaction.id, deserializeTransaction(transaction))
    }

    this.state.spendingGoals = data.spendingGoals ?? {}

    // Update meta
    this.state.meta = {
      bootstrapCursor: data.cursor,
    }

    this.saveToIndexedDB()
    this.notifyListeners()
  }

  /**
   * Apply delta: upsert transactions by id without clearing existing data.
   * Used when a local cursor exists (incremental sync).
   */
  applyDelta(data: SerializedBootstrapData): void {
    // Update accounts (full replace since account list is small)
    this.state.accounts.clear()
    for (const account of data.accounts) {
      this.state.accounts.set(account.id, deserializeAccount(account))
    }

    // Upsert transactions (do not clear existing)
    for (const transaction of data.transactions) {
      this.state.transactions.set(transaction.id, deserializeTransaction(transaction))
    }

    this.state.spendingGoals = {
      ...this.state.spendingGoals,
      ...(data.spendingGoals ?? {}),
    }

    // Update meta
    this.state.meta = {
      bootstrapCursor: data.cursor,
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

  upsertSpendingGoal(categoryId: CategoryId, goal: Goal): void {
    this.state.spendingGoals = {
      ...this.state.spendingGoals,
      [categoryId]: goal,
    }

    this.saveToIndexedDB()
    this.notifySpendingGoalListeners(categoryId)
  }

  private spendingGoalListeners: Map<CategoryId, Set<Listener>> = new Map()

  subscribeSpendingGoal(categoryId: CategoryId, listener: Listener): () => void {
    const existing = this.spendingGoalListeners.get(categoryId)
    if (existing) {
      existing.add(listener)
    } else {
      this.spendingGoalListeners.set(categoryId, new Set([listener]))
    }

    return () => {
      const set = this.spendingGoalListeners.get(categoryId)
      if (!set) return
      set.delete(listener)
      if (set.size === 0) this.spendingGoalListeners.delete(categoryId)
    }
  }

  private notifySpendingGoalListeners(categoryId: CategoryId): void {
    const listeners = this.spendingGoalListeners.get(categoryId)
    if (!listeners) return
    listeners.forEach((listener) => listener())
  }

  private emptySpendingGoal: Goal = { goal: null, tolerance: null }

  getSpendingGoal(categoryId: CategoryId): Goal {
    return this.state.spendingGoals[categoryId] ?? this.emptySpendingGoal
  }

  getSpendingGoals(): GoalsByCategory {
    return this.state.spendingGoals
  }

  /**
   * Get all accounts
   */
  getAccounts(): Account[] {
    return Array.from(this.state.accounts.values())
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
   * Get store metadata
   */
  getMeta(): LocalStoreMeta {
    return this.state.meta
  }

  /**
   * Get the bootstrap cursor for delta sync
   */
  getBootstrapCursor(): number | null {
    return this.state.meta.bootstrapCursor
  }

  /**
   * Check if store has been hydrated
   */
  isHydrated(): boolean {
    return this.state.meta.bootstrapCursor !== null
  }

  /**
   * Get snapshot for React useSyncExternalStore.
   * Returns a new object reference when state changes to trigger re-renders.
   */
  getSnapshot(): LocalStoreState {
    if (!this.cachedSnapshot) {
      // Create a new object reference so React detects the change
        this.cachedSnapshot = {
          accounts: this.state.accounts,
          transactions: this.state.transactions,
          spendingGoals: this.state.spendingGoals,
          meta: this.state.meta,
        }

    }
    return this.cachedSnapshot
  }
}

// Singleton instance
export const localStore = new LocalStore()
