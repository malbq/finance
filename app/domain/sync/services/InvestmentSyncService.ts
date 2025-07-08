import { PrismaClient } from '@prisma/client'
import {
  PluggyDataMapper,
  type PluggyInvestment,
  type PluggyInvestmentTransaction,
} from '../mappers/PluggyDataMapper'
import { PluggyClient } from './PluggyClient'

export class InvestmentSyncService {
  constructor(private prisma: PrismaClient, private apiKey: string) {}

  async syncInvestments(): Promise<PluggyInvestment[]> {
    const itemIds = PluggyClient.getItemIds()
    const allInvestments: PluggyInvestment[] = []

    for (const itemId of itemIds) {
      try {
        const response = await PluggyClient.fetchData<PluggyInvestment>(
          this.apiKey,
          '/investments',
          { itemId }
        )
        allInvestments.push(...response.results)
      } catch (error) {
        console.error(
          `Failed to fetch investments for itemId ${itemId}:`,
          error
        )
        throw error
      }
    }

    for (const investment of allInvestments) {
      try {
        await this.syncSingleInvestment(investment)
      } catch (error) {
        console.error(`Failed to sync investment ${investment.id}:`, error)
        throw error
      }
    }

    return allInvestments
  }

  async syncInvestmentTransactions(
    investments: PluggyInvestment[]
  ): Promise<void> {
    for (const investment of investments) {
      try {
        await this.syncInvestmentTransactionsForInvestment(investment)
      } catch (error) {
        console.error(
          `Failed to sync investment transactions for ${investment.id}:`,
          error
        )
        throw error
      }
    }
  }

  private async syncSingleInvestment(
    investment: PluggyInvestment
  ): Promise<void> {
    const investmentData = PluggyDataMapper.mapInvestmentToDatabase(investment)

    await this.prisma.investment.upsert({
      where: {
        itemId_id: {
          itemId: investment.itemId,
          id: investment.id,
        },
      },
      update: {
        ...investmentData,
        updatedAt: new Date(),
      },
      create: investmentData,
    })
  }

  private async syncInvestmentTransactionsForInvestment(
    investment: PluggyInvestment
  ): Promise<void> {
    const latestTransaction = await this.prisma.investmentTransaction.findFirst(
      {
        where: { investmentId: investment.id },
        orderBy: { date: 'desc' },
      }
    )

    const params: Record<string, string> = {
      pageSize: '500',
    }

    if (latestTransaction) {
      params.from = latestTransaction.date.toISOString().split('T')[0]
    }

    const response = await PluggyClient.fetchData<PluggyInvestmentTransaction>(
      this.apiKey,
      `/investments/${investment.id}/transactions`,
      params
    )

    for (const transaction of response.results) {
      try {
        await this.syncSingleInvestmentTransaction(transaction, investment.id)
      } catch (error) {
        console.error(
          `Failed to sync investment transaction ${transaction.id}:`,
          error
        )
        throw error
      }
    }
  }

  private async syncSingleInvestmentTransaction(
    transaction: PluggyInvestmentTransaction,
    investmentId: string
  ): Promise<void> {
    const transactionData =
      PluggyDataMapper.mapInvestmentTransactionToDatabase(transaction)

    transactionData.investmentId = investmentId

    await this.prisma.investmentTransaction.upsert({
      where: { id: transaction.id },
      update: {
        ...transactionData,
        updatedAt: new Date(),
      },
      create: transactionData,
    })
  }
}
