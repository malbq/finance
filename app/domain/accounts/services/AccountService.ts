import { PrismaClient, type Prisma } from '@prisma-app/client'
import { formatCurrency } from '~/utils/formatCurrency'
import type { Account } from '../entities/Account'

export class AccountService {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      include: {
        creditData: true,
      },
      orderBy: [
        {
          type: 'asc',
        },
        {
          itemId: 'asc',
        },
      ],
    })

    return accounts.map(this.mapPrismaToEntity)
  }

  private mapPrismaToEntity = (
    accountData: Prisma.AccountGetPayload<{
      include: {
        creditData: true
      }
    }>
  ): Account => {
    const account: Account = {
      id: accountData.id,
      type: accountData.type,
      subtype: accountData.subtype ?? undefined,
      name: accountData.name,
      balance: accountData.balance.toNumber(),
      balanceFormatted: formatCurrency(accountData.balance.toNumber()),
      currencyCode: accountData.currencyCode,
    }
    if (accountData.type === 'CREDIT' && accountData.creditData) {
      account.creditData = {
        level: accountData.creditData.level,
        brand: accountData.creditData.brand,
        balanceDueDate: accountData.creditData.balanceDueDate,
        creditLimit: accountData.creditData.creditLimit.toNumber(),
        creditLimitFormatted: formatCurrency(
          accountData.creditData.creditLimit.toNumber()
        ),
        availableCreditLimit:
          accountData.creditData.availableCreditLimit.toNumber(),
        availableCreditLimitFormatted: formatCurrency(
          accountData.creditData.availableCreditLimit.toNumber()
        ),
      }
    }

    return account
  }
}
