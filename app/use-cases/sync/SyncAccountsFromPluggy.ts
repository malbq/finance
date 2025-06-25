import { AccountSyncService } from '../../domain/sync/services/AccountSyncService'
import { PluggyClient } from '../../domain/sync/services/PluggyClient'
import { prisma } from '../../lib/db.server'

export const SyncAccountsFromPluggy = {
  async execute() {
    try {
      const apiKey = await PluggyClient.authenticate()
      const accountSyncService = new AccountSyncService(prisma, apiKey)

      const accounts = await accountSyncService.syncAccounts()
      console.log(`Successfully synced ${accounts.length} accounts`)

      return {
        success: true,
        count: accounts.length,
        accounts: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
        })),
      }
    } catch (error) {
      console.error('Failed to sync accounts from Pluggy:', error)
      throw error
    }
  },
}
