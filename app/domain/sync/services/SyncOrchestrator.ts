import { PrismaClient } from '@prisma/client'
import { AccountSyncService } from './AccountSyncService'
import { CategorySyncService } from './CategorySyncService'
import { InvestmentSyncService } from './InvestmentSyncService'
import { PluggyApiError, PluggyClient } from './PluggyClient'
import { TransactionSyncService } from './TransactionSyncService'

interface SyncResult {
  success: boolean
  message: string
  details: {
    accountsCount: number
    investmentsCount: number
    categoriesSynced: boolean
    transactionsSynced: boolean
    investmentTransactionsSynced: boolean
  }
  errors: string[]
}

export class SyncOrchestrator {
  constructor(private prisma: PrismaClient) {}

  async executeFull(): Promise<SyncResult> {
    const errors: string[] = []
    let accountsCount = 0
    let investmentsCount = 0
    let categoriesSynced = false
    let transactionsSynced = false
    let investmentTransactionsSynced = false

    try {
      console.log('Starting comprehensive data synchronization...')

      const apiKey = await PluggyClient.authenticate()
      console.log('Authentication successful')

      const accountSyncService = new AccountSyncService(this.prisma, apiKey)
      const transactionSyncService = new TransactionSyncService(this.prisma, apiKey)
      const investmentSyncService = new InvestmentSyncService(this.prisma, apiKey)
      const categorySyncService = new CategorySyncService(this.prisma, apiKey)

      console.log('Syncing accounts...')
      const accounts = await accountSyncService.syncAccounts()
      accountsCount = accounts.length
      console.log(`Synced ${accountsCount} accounts`)

      console.log('Syncing investments...')
      const investments = await investmentSyncService.syncInvestments()
      investmentsCount = investments.length
      console.log(`Synced ${investmentsCount} investments`)

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
          () => investmentSyncService.syncInvestmentTransactions(investments),
          'Investment transactions synced',
          'Failed to sync investment transactions',
          errors
        ).then(() => {
          investmentTransactionsSynced = true
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
          investmentsCount,
          categoriesSynced,
          transactionsSynced,
          investmentTransactionsSynced,
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
          investmentsCount,
          categoriesSynced,
          transactionsSynced,
          investmentTransactionsSynced,
        },
        errors,
      }
    }
  }

  async executeAccounts(): Promise<SyncResult> {
    try {
      const apiKey = await PluggyClient.authenticate()
      const accountSyncService = new AccountSyncService(this.prisma, apiKey)

      const accounts = await accountSyncService.syncAccounts()

      return {
        success: true,
        message: `Successfully synced ${accounts.length} accounts`,
        details: {
          accountsCount: accounts.length,
          investmentsCount: 0,
          categoriesSynced: false,
          transactionsSynced: false,
          investmentTransactionsSynced: false,
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
          investmentsCount: 0,
          categoriesSynced: false,
          transactionsSynced: false,
          investmentTransactionsSynced: false,
        },
        errors: [errorMessage],
      }
    }
  }

  async executeTransactions(): Promise<SyncResult> {
    try {
      const apiKey = await PluggyClient.authenticate()
      const accountSyncService = new AccountSyncService(this.prisma, apiKey)
      const transactionSyncService = new TransactionSyncService(this.prisma, apiKey)

      const accounts = await accountSyncService.syncAccounts()
      await transactionSyncService.syncTransactions(accounts)

      return {
        success: true,
        message: `Successfully synced transactions for ${accounts.length} accounts`,
        details: {
          accountsCount: accounts.length,
          investmentsCount: 0,
          categoriesSynced: false,
          transactionsSynced: true,
          investmentTransactionsSynced: false,
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
          investmentsCount: 0,
          categoriesSynced: false,
          transactionsSynced: false,
          investmentTransactionsSynced: false,
        },
        errors: [errorMessage],
      }
    }
  }

  async executeInvestments(): Promise<SyncResult> {
    try {
      const apiKey = await PluggyClient.authenticate()
      const investmentSyncService = new InvestmentSyncService(this.prisma, apiKey)

      const investments = await investmentSyncService.syncInvestments()
      await investmentSyncService.syncInvestmentTransactions(investments)

      return {
        success: true,
        message: `Successfully synced ${investments.length} investments`,
        details: {
          accountsCount: 0,
          investmentsCount: investments.length,
          categoriesSynced: false,
          transactionsSynced: false,
          investmentTransactionsSynced: true,
        },
        errors: [],
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error)
      return {
        success: false,
        message: 'Failed to sync investments',
        details: {
          accountsCount: 0,
          investmentsCount: 0,
          categoriesSynced: false,
          transactionsSynced: false,
          investmentTransactionsSynced: false,
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
