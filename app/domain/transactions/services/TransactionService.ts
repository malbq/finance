import { PrismaClient, type Prisma } from '@prisma-app/client'
import { formatCurrency } from '~/utils/formatCurrency'
import { formatDate } from '~/utils/formatDate'
import { formatTime } from '~/utils/formatTime'
import type { Transaction } from '../entities/Transaction'

const TODAY = new Date()

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId },
      include: {
        paymentData: {
          include: {
            payer: true,
            receiver: true,
          },
        },
        creditCardMetadata: true,
        acquirerData: true,
        merchant: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return transactions.map(this.mapPrismaToEntity)
  }

  async updateCategory(id: string, categoryId: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { categoryId },
    })
  }

  private mapPrismaToEntity = (
    transactionData: Prisma.TransactionGetPayload<{
      include: {
        paymentData: {
          include: {
            payer: true
            receiver: true
          }
        }
        creditCardMetadata: true
        acquirerData: true
        merchant: true
      }
    }>
  ): Transaction => {
    const metadata = transactionData.creditCardMetadata?.data
      ? JSON.parse(transactionData.creditCardMetadata.data)
      : undefined

    const transaction: Transaction = {
      id: transactionData.id,
      accountId: transactionData.accountId,
      description: transactionData.description,
      currencyCode: transactionData.currencyCode,
      amount: transactionData.amount.toNumber(),
      amountFormatted: formatCurrency(transactionData.amount.toNumber()),
      date: transactionData.date,
      dateFormatted: formatDate(transactionData.date),
      timeFormatted: formatTime(transactionData.date),
      futurePayment: transactionData.date > TODAY,
      category: transactionData.category ?? undefined,
      categoryId: transactionData.categoryId ?? undefined,
      balance: transactionData.balance
        ? Number(transactionData.balance)
        : undefined,
      status: transactionData.status,
      type: transactionData.type,
      operationType: transactionData.operationType ?? undefined,
      createdAt: transactionData.createdAt,
      updatedAt: transactionData.updatedAt,
      paymentData: transactionData.paymentData
        ? {
            id: transactionData.paymentData.id,
            transactionId: transactionData.paymentData.transactionId,
            paymentMethod:
              transactionData.paymentData.paymentMethod ?? undefined,
            payer: transactionData.paymentData.payer
              ? {
                  id: transactionData.paymentData.payer.id,
                  accountNumber:
                    transactionData.paymentData.payer.accountNumber ??
                    undefined,
                  branchNumber:
                    transactionData.paymentData.payer.branchNumber ?? undefined,
                  documentValue:
                    transactionData.paymentData.payer.documentValue ??
                    undefined,
                  name: transactionData.paymentData.payer.name ?? undefined,
                  routingNumber:
                    transactionData.paymentData.payer.routingNumber ??
                    undefined,
                  routingNumberISPB:
                    transactionData.paymentData.payer.routingNumberISPB ??
                    undefined,
                }
              : undefined,
            receiver: transactionData.paymentData.receiver
              ? {
                  id: transactionData.paymentData.receiver.id,
                  accountNumber:
                    transactionData.paymentData.receiver.accountNumber ??
                    undefined,
                  branchNumber:
                    transactionData.paymentData.receiver.branchNumber ??
                    undefined,
                  documentType:
                    transactionData.paymentData.receiver.documentType ??
                    undefined,
                  documentValue:
                    transactionData.paymentData.receiver.documentValue ??
                    undefined,
                  name: transactionData.paymentData.receiver.name ?? undefined,
                  routingNumber:
                    transactionData.paymentData.receiver.routingNumber ??
                    undefined,
                  routingNumberISPB:
                    transactionData.paymentData.receiver.routingNumberISPB ??
                    undefined,
                }
              : undefined,
          }
        : undefined,
      creditCardMetadata: transactionData.creditCardMetadata
        ? {
            id: transactionData.creditCardMetadata.id,
            transactionId: transactionData.creditCardMetadata.transactionId,
            cardNumber: metadata.cardNumber ?? undefined,
            purchaseDate: metadata.purchaseDate ?? undefined,
            purchaseDateFormatted: metadata.purchaseDate
              ? formatDate(metadata.purchaseDate)
              : undefined,
            purchaseTimeFormatted: metadata.purchaseDate
              ? formatTime(metadata.purchaseDate)
              : undefined,
            totalInstallments: metadata.totalInstallments ?? undefined,
            installmentNumber: metadata.installmentNumber ?? undefined,
          }
        : undefined,
      merchant: transactionData.merchant
        ? {
            id: transactionData.merchant.id,
            transactionId: transactionData.merchant.transactionId,
            cnae: transactionData.merchant.cnae ?? undefined,
            cnpj: transactionData.merchant.cnpj ?? undefined,
            name: transactionData.merchant.name ?? undefined,
            category: transactionData.merchant.category ?? undefined,
            businessName: transactionData.merchant.businessName ?? undefined,
          }
        : undefined,
    }

    return transaction
  }
}
