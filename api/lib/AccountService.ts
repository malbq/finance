import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { Account } from '../../domain/Account'
import { formatCurrency } from '../../utils/formatCurrency'
import { accounts, creditData } from '../db/schema'

export class AccountService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async findAll(): Promise<Account[]> {
    const result = await this.db
      .select({
        account: accounts,
        creditData: creditData,
      })
      .from(accounts)
      .leftJoin(creditData, eq(accounts.id, creditData.accountId))
      .orderBy(accounts.type, accounts.itemId)

    return result.map(this.mapToEntity)
  }

  private mapToEntity = (result: {
    account: typeof accounts.$inferSelect
    creditData: typeof creditData.$inferSelect | null
  }): Account => {
    const accountData = result.account
    const creditData = result.creditData

    const account: Account = {
      id: accountData.id,
      type: accountData.type,
      subtype: accountData.subtype ?? undefined,
      name: accountData.name,
      balance: accountData.balance,
      balanceFormatted: formatCurrency(accountData.balance),
      currencyCode: accountData.currencyCode,
    }

    if (accountData.type === 'CREDIT' && creditData) {
      account.creditData = {
        level: creditData.level,
        brand: creditData.brand,
        balanceDueDate: new Date(creditData.balanceDueDate),
        creditLimit: creditData.creditLimit,
        creditLimitFormatted: formatCurrency(creditData.creditLimit),
        availableCreditLimit: creditData.availableCreditLimit,
        availableCreditLimitFormatted: formatCurrency(creditData.availableCreditLimit),
      }
    }

    return account
  }
}
