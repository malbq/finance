import { PrismaClient, type Prisma } from '@prisma-app/client'
import {
  Investment,
  InvestmentStatus,
  InvestmentSubtype,
  InvestmentTransactionType,
  InvestmentType,
  MovementType,
  type InvestmentData,
  type InvestmentTransactionData,
} from '../entities/Investment'

export class InvestmentService {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Investment | null> {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: {
        investmentTransactions: true,
      },
    })

    if (!investment) return null

    return this.mapPrismaToEntity(investment)
  }

  async findByItemId(itemId: string): Promise<Investment[]> {
    const investments = await this.prisma.investment.findMany({
      where: { itemId },
      include: {
        investmentTransactions: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return investments.map(this.mapPrismaToEntity)
  }

  async findAll(): Promise<Investment[]> {
    const investments = await this.prisma.investment.findMany({
      include: {
        investmentTransactions: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return investments.map(this.mapPrismaToEntity)
  }

  async findActiveInvestments(): Promise<Investment[]> {
    const investments = await this.prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        investmentTransactions: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return investments.map(this.mapPrismaToEntity)
  }

  async findByType(type: InvestmentType): Promise<Investment[]> {
    const investments = await this.prisma.investment.findMany({
      where: { type },
      include: {
        investmentTransactions: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return investments.map(this.mapPrismaToEntity)
  }

  async getTotalBalance(): Promise<number> {
    const result = await this.prisma.investment.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        status: 'ACTIVE',
      },
    })
    return Number(result._sum.balance) || 0
  }

  private mapPrismaToEntity = (
    investment: Prisma.InvestmentGetPayload<{
      include: {
        investmentTransactions: true
      }
    }>
  ): Investment => {
    const investmentTransactions: InvestmentTransactionData[] =
      investment.investmentTransactions.map((transaction) => ({
        id: transaction.id,
        investmentId: transaction.investmentId,
        type: transaction.type as InvestmentTransactionType,
        movementType: transaction.movementType as MovementType | undefined,
        quantity: transaction.quantity ?? undefined,
        value: transaction.value ?? undefined,
        amount: transaction.amount ?? undefined,
        netAmount: transaction.netAmount ?? undefined,
        description: transaction.description ?? undefined,
        agreedRate: transaction.agreedRate ?? undefined,
        date: transaction.date,
        tradeDate: transaction.tradeDate ?? undefined,
        brokerageNumber: transaction.brokerageNumber ?? undefined,
        expenses: transaction.expenses ?? undefined,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }))

    const investmentData: InvestmentData = {
      id: investment.id,
      itemId: investment.itemId,
      type: investment.type as InvestmentType,
      subtype: investment.subtype as InvestmentSubtype | undefined,
      number: investment.number ?? undefined,
      balance: Number(investment.balance),
      name: investment.name,
      lastMonthRate: investment.lastMonthRate ?? undefined,
      lastTwelveMonthsRate: investment.lastTwelveMonthsRate ?? undefined,
      annualRate: investment.annualRate ?? undefined,
      currencyCode: investment.currencyCode,
      code: investment.code ?? undefined,
      isin: investment.isin ?? undefined,
      value: investment.value ?? undefined,
      quantity: investment.quantity ?? undefined,
      amount: investment.amount ?? undefined,
      taxes: investment.taxes ?? undefined,
      taxes2: investment.taxes2 ?? undefined,
      date: investment.date,
      owner: investment.owner ?? undefined,
      amountProfit: investment.amountProfit ?? undefined,
      amountWithdrawal: investment.amountWithdrawal ?? undefined,
      amountOriginal: investment.amountOriginal ?? undefined,
      dueDate: investment.dueDate ?? undefined,
      issuer: investment.issuer ?? undefined,
      issuerCNPJ: investment.issuerCNPJ ?? undefined,
      issueDate: investment.issueDate ?? undefined,
      rate: investment.rate ?? undefined,
      rateType: investment.rateType ?? undefined,
      fixedAnnualRate: investment.fixedAnnualRate ?? undefined,
      status: investment.status as InvestmentStatus | undefined,
      institution: investment.institution ?? undefined,
      metadata: investment.metadata ?? undefined,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
      investmentTransactions,
    }

    return new Investment(investmentData)
  }
}
