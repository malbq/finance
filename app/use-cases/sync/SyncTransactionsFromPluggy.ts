import { AccountSyncService } from '../../domain/sync/services/AccountSyncService'
import { PluggyClient } from '../../domain/sync/services/PluggyClient'
import { TransactionSyncService } from '../../domain/sync/services/TransactionSyncService'
import { prisma } from '../../lib/db.server'

export const SyncTransactionsFromPluggy = {
  async execute() {
    try {
      const apiKey = await PluggyClient.authenticate()
      const accountSyncService = new AccountSyncService(prisma, apiKey)
      const transactionSyncService = new TransactionSyncService(prisma, apiKey)

      const accounts = await accountSyncService.syncAccounts()
      await transactionSyncService.syncTransactions(accounts)

      console.log(
        `Successfully synced transactions for ${accounts.length} accounts`
      )

      return {
        success: true,
        accountCount: accounts.length,
      }
    } catch (error) {
      console.error('Failed to sync transactions from Pluggy:', error)
      throw error
    }
  },
}
