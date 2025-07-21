import { PrismaClient } from '@prisma/client'
import {
  PluggyDataMapper,
  type PluggyAccount,
} from '../mappers/PluggyDataMapper'
import { PluggyClient } from './PluggyClient'

export class AccountSyncService {
  constructor(private prisma: PrismaClient, private apiKey: string) {}

  async syncAccounts(): Promise<PluggyAccount[]> {
    const itemIds = PluggyClient.getItemIds()
    const allAccounts: PluggyAccount[] = []

    for (const itemId of itemIds) {
      console.log('Syncing accounts for itemId:', itemId)
      try {
        const response = await PluggyClient.fetchData<PluggyAccount>(
          this.apiKey,
          '/accounts',
          { itemId }
        )
        allAccounts.push(...response.results)
      } catch (error) {
        console.error(`Failed to fetch accounts for itemId ${itemId}:`, error)
        throw error
      }
    }

    for (const account of allAccounts) {
      try {
        await this.syncSingleAccount(account)
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error)
        throw error
      }
    }

    return allAccounts
  }

  private async syncSingleAccount(account: PluggyAccount): Promise<void> {
    console.log('Syncing account:', account.name)

    if (account.subtype === 'SAVINGS_ACCOUNT') {
      console.log('Skipping savings account:', account.name)
      return
    }

    await this.prisma.$transaction(async (tx: PrismaClient) => {
      const accountData = PluggyDataMapper.mapAccountToDatabase(account)

      await tx.account.upsert({
        where: {
          id: account.id,
        },
        update: accountData,
        create: accountData,
      })

      if (account.bankData) {
        const bankData = PluggyDataMapper.mapBankDataToDatabase(
          account.id,
          account.bankData
        )

        await tx.bankData.upsert({
          where: { accountId: account.id },
          update: bankData,
          create: bankData,
        })
      }

      if (account.creditData) {
        const creditData = PluggyDataMapper.mapCreditDataToDatabase(
          account.id,
          account.creditData
        )

        await tx.creditData.upsert({
          where: { accountId: account.id },
          update: creditData,
          create: creditData,
        })
      }
    })
  }
}
