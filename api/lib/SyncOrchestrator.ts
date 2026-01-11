import { drizzle } from 'drizzle-orm/bun-sqlite'
import { AccountSyncService } from './AccountSyncService'
import { CategorySyncService } from './CategorySyncService'
import { PluggyApiError, PluggyClient } from './PluggyClient'
import { TransactionSyncService } from './TransactionSyncService'

interface SyncResult {
  success: boolean
  message: string
  details: {
    accountsCount: number
    categoriesSynced: boolean
    transactionsSynced: boolean
  }
  errors: string[]
}

export class SyncOrchestrator {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async executeFull(): Promise<SyncResult> {
    const errors: string[] = []
    let accountsCount = 0
    let categoriesSynced = false
    let transactionsSynced = false

    try {
      console.log('Starting comprehensive data synchronization...')

      const apiKey = await PluggyClient.authenticate()
      console.log('Authentication successful')

      const accountSyncService = new AccountSyncService(this.db, apiKey)
      const transactionSyncService = new TransactionSyncService(this.db, apiKey)
      const categorySyncService = new CategorySyncService(this.db, apiKey)

      console.log('Syncing accounts...')
      const accounts = await accountSyncService.syncAccounts()
      accountsCount = accounts.length
      console.log(`Synced ${accountsCount} accounts`)

      await Promise.allSettled([
        this.syncWithErrorHandling(
          () => transactionSyncService.syncTransactions(accounts),
          'Transactions synced',
          'Failed to sync transactions',
          errors
        ).then(() => {
          transactionsSynced = true
        }),

        this.syncWithErrorHandling(
          () => categorySyncService.syncCategories(),
          'Categories synced',
          'Failed to sync categories',
          errors
        ).then(() => {
          categoriesSynced = true
        }),
      ])

      const success = errors.length === 0
      console.log(
        success ? 'Data synchronized successfully!' : 'Data synchronized with some errors'
      )

      return {
        success,
        message: success
          ? 'Data synchronized successfully!'
          : `Data synchronized with ${errors.length} error(s)`,
        details: {
          accountsCount,
          categoriesSynced,
          transactionsSynced,
        },
        errors,
      }
    } catch (error) {
      console.error('Critical sync error:', error)

      const errorMessage = this.getErrorMessage(error)
      errors.push(errorMessage)

      return {
        success: false,
        message: 'Synchronization failed',
        details: {
          accountsCount,
          categoriesSynced,
          transactionsSynced,
        },
        errors,
      }
    }
  }

  async executeAccounts(): Promise<SyncResult> {
    try {
      const apiKey = await PluggyClient.authenticate()
      const accountSyncService = new AccountSyncService(this.db, apiKey)

      const accounts = await accountSyncService.syncAccounts()

      return {
        success: true,
        message: `Successfully synced ${accounts.length} accounts`,
        details: {
          accountsCount: accounts.length,
          categoriesSynced: false,
          transactionsSynced: false,
        },
        errors: [],
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error)
      return {
        success: false,
        message: 'Failed to sync accounts',
        details: {
          accountsCount: 0,
          categoriesSynced: false,
          transactionsSynced: false,
        },
        errors: [errorMessage],
      }
    }
  }

  async executeTransactions(): Promise<SyncResult> {
    try {
      const apiKey = await PluggyClient.authenticate()
      const accountSyncService = new AccountSyncService(this.db, apiKey)
      const transactionSyncService = new TransactionSyncService(this.db, apiKey)

      const accounts = await accountSyncService.syncAccounts()
      await transactionSyncService.syncTransactions(accounts)

      return {
        success: true,
        message: `Successfully synced transactions for ${accounts.length} accounts`,
        details: {
          accountsCount: accounts.length,
          categoriesSynced: false,
          transactionsSynced: true,
        },
        errors: [],
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error)
      return {
        success: false,
        message: 'Failed to sync transactions',
        details: {
          accountsCount: 0,
          categoriesSynced: false,
          transactionsSynced: false,
        },
        errors: [errorMessage],
      }
    }
  }

  private async syncWithErrorHandling(
    operation: () => Promise<void>,
    successMessage: string,
    errorMessage: string,
    errors: string[]
  ): Promise<void> {
    try {
      await operation()
      console.log(successMessage)
    } catch (error) {
      const msg = `${errorMessage}: ${this.getErrorMessage(error)}`
      console.error(msg)
      errors.push(msg)
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof PluggyApiError) {
      return `Pluggy API Error: ${error.message}${error.endpoint ? ` (${error.endpoint})` : ''}`
    }

    if (error instanceof Error) {
      return error.message
    }

    return 'Unknown error occurred'
  }
}
