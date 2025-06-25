import { CategorySyncService } from '../../domain/sync/services/CategorySyncService'
import { InvestmentSyncService } from '../../domain/sync/services/InvestmentSyncService'
import { PluggyClient } from '../../domain/sync/services/PluggyClient'
import { prisma } from '../../lib/db.server'

export const SyncInvestmentsFromPluggy = {
  async execute() {
    try {
      const apiKey = await PluggyClient.authenticate()
      const investmentSyncService = new InvestmentSyncService(prisma, apiKey)
      const categorySyncService = new CategorySyncService(prisma, apiKey)

      const investments = await investmentSyncService.syncInvestments()
      await investmentSyncService.syncInvestmentTransactions(investments)
      await categorySyncService.syncCategories()

      console.log(`Successfully synced ${investments.length} investments`)

      return {
        success: true,
        count: investments.length,
        investments: investments.map((investment) => ({
          id: investment.id,
          name: investment.name,
          type: investment.type,
        })),
      }
    } catch (error) {
      console.error('Failed to sync investments from Pluggy:', error)
      throw error
    }
  },
}
