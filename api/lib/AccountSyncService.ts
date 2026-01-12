import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { accounts, bankData, creditData } from '../db/schema'
import { PluggyClient } from './PluggyClient'
import { PluggyDataMapper, type PluggyAccount } from './PluggyDataMapper'

export class AccountSyncService {
  constructor(private db: ReturnType<typeof drizzle>, private apiKey: string) {}

  async syncAccounts(): Promise<PluggyAccount[]> {
    const itemIds = PluggyClient.getItemIds()
    const allAccounts: PluggyAccount[] = []

    for (const itemId of itemIds) {
      console.log('Syncing accounts for itemId:', itemId)
      try {
        const response = await PluggyClient.fetchData<PluggyAccount>(this.apiKey, '/accounts', {
          itemId,
        })
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

    await this.db.transaction(async (tx) => {
      const accountData = PluggyDataMapper.mapAccountToDatabase(account)

      const existingAccount = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, account.id))
        .limit(1)

      if (existingAccount.length > 0) {
        await tx.update(accounts).set(accountData).where(eq(accounts.id, account.id))
      } else {
        await tx.insert(accounts).values(accountData)
      }

      if (account.bankData) {
        const bankDataRecord = PluggyDataMapper.mapBankDataToDatabase(account.id, account.bankData)

        const existingBankData = await tx
          .select()
          .from(bankData)
          .where(eq(bankData.accountId, account.id))
          .limit(1)

        if (existingBankData.length > 0) {
          await tx.update(bankData).set(bankDataRecord).where(eq(bankData.accountId, account.id))
        } else {
          await tx.insert(bankData).values(bankDataRecord)
        }
      }

      if (account.creditData) {
        const rawCreditData = PluggyDataMapper.mapCreditDataToDatabase(
          account.id,
          account.creditData
        )
        const balanceDueDate =
          typeof rawCreditData.balanceDueDate === 'number'
            ? rawCreditData.balanceDueDate
            : new Date(rawCreditData.balanceDueDate ?? Date.now()).getTime()
        const creditDataRecord = {
          ...rawCreditData,
          brand: rawCreditData.brand || '',
          level: rawCreditData.level || '',
          balanceDueDate,
          creditLimit: rawCreditData.creditLimit || 0,
          availableCreditLimit: rawCreditData.availableCreditLimit || 0,
        }

        const existingCreditData = await tx
          .select()
          .from(creditData)
          .where(eq(creditData.accountId, account.id))
          .limit(1)

        if (existingCreditData.length > 0) {
          await tx
            .update(creditData)
            .set(creditDataRecord)
            .where(eq(creditData.accountId, account.id))
        } else {
          await tx.insert(creditData).values(creditDataRecord)
        }
      }
    })
  }
}
