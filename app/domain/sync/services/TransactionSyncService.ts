import { PrismaClient } from '@prisma/client'
import {
  PluggyDataMapper,
  type PluggyAccount,
  type PluggyTransaction,
} from '../mappers/PluggyDataMapper'
import { PluggyClient } from './PluggyClient'

export class TransactionSyncService {
  constructor(private prisma: PrismaClient, private apiKey: string) {}

  async syncTransactions(accounts: PluggyAccount[]): Promise<void> {
    for (const account of accounts) {
      try {
        await this.syncAccountTransactions(account)
      } catch (error) {
        console.error(
          `Failed to sync transactions for account ${account.id}:`,
          error
        )
        throw error
      }
    }
  }

  private async syncAccountTransactions(account: PluggyAccount): Promise<void> {
    const params: Record<string, string> = {
      accountId: account.id,
      pageSize: '500',
    }

    const latestTransaction = await this.prisma.transaction.findFirst({
      where: { accountId: account.id },
      orderBy: { date: 'desc' },
    })

    if (latestTransaction) {
      params.from = latestTransaction.date.toISOString().split('T')[0]
    }

    params.from = '2025-06-14'

    const response = await PluggyClient.fetchData<PluggyTransaction>(
      this.apiKey,
      '/transactions',
      params
    )

    for (const transaction of response.results) {
      try {
        await this.syncSingleTransaction(transaction)
      } catch (error) {
        console.error(`Failed to sync transaction ${transaction.id}:`, error)
        throw error
      }
    }
  }

  private async syncSingleTransaction(
    transaction: PluggyTransaction
  ): Promise<void> {
    await this.prisma.$transaction(async (tx: PrismaClient) => {
      const transactionData =
        PluggyDataMapper.mapTransactionToDatabase(transaction)

      await tx.transaction.upsert({
        where: { id: transaction.id },
        update: {
          ...transactionData,
          updatedAt: new Date(),
        },
        create: transactionData,
      })

      if (transaction.creditCardMetadata) {
        await tx.creditCardMetadata.upsert({
          where: { transactionId: transaction.id },
          update: {
            data: JSON.stringify(transaction.creditCardMetadata),
          },
          create: {
            transactionId: transaction.id,
            data: JSON.stringify(transaction.creditCardMetadata),
          },
        })
      }

      if (transaction.paymentData) {
        const paymentData = await tx.paymentData.upsert({
          where: { transactionId: transaction.id },
          update: {
            paymentMethod: transaction.paymentData.paymentMethod || null,
            reason: transaction.paymentData.reason || null,
            receiverReferenceId:
              transaction.paymentData.receiverReferenceId || null,
            referenceNumber: transaction.paymentData.referenceNumber || null,
            boletoMetadata: transaction.paymentData.boletoMetadata || null,
          },
          create: {
            transactionId: transaction.id,
            paymentMethod: transaction.paymentData.paymentMethod || null,
            reason: transaction.paymentData.reason || null,
            receiverReferenceId:
              transaction.paymentData.receiverReferenceId || null,
            referenceNumber: transaction.paymentData.referenceNumber || null,
            boletoMetadata: transaction.paymentData.boletoMetadata || null,
          },
        })

        if (transaction.paymentData.payer) {
          await tx.paymentParticipant.upsert({
            where: { payerPaymentDataId: paymentData.id },
            update: {
              accountNumber:
                transaction.paymentData.payer.accountNumber || null,
              branchNumber: transaction.paymentData.payer.branchNumber || null,
              documentType:
                transaction.paymentData.payer.documentNumber?.type || null,
              documentValue:
                transaction.paymentData.payer.documentNumber?.value || null,
              name: transaction.paymentData.payer.name || null,
              routingNumber:
                transaction.paymentData.payer.routingNumber || null,
              routingNumberISPB:
                transaction.paymentData.payer.routingNumberISPB || null,
            },
            create: {
              accountNumber:
                transaction.paymentData.payer.accountNumber || null,
              branchNumber: transaction.paymentData.payer.branchNumber || null,
              documentType:
                transaction.paymentData.payer.documentNumber?.type || null,
              documentValue:
                transaction.paymentData.payer.documentNumber?.value || null,
              name: transaction.paymentData.payer.name || null,
              routingNumber:
                transaction.paymentData.payer.routingNumber || null,
              routingNumberISPB:
                transaction.paymentData.payer.routingNumberISPB || null,
              payerPaymentDataId: paymentData.id,
            },
          })
        }

        if (transaction.paymentData.receiver) {
          await tx.paymentParticipant.upsert({
            where: { receiverPaymentDataId: paymentData.id },
            update: {
              accountNumber:
                transaction.paymentData.receiver.accountNumber || null,
              branchNumber:
                transaction.paymentData.receiver.branchNumber || null,
              documentType:
                transaction.paymentData.receiver.documentNumber?.type || null,
              documentValue:
                transaction.paymentData.receiver.documentNumber?.value || null,
              name: transaction.paymentData.receiver.name || null,
              routingNumber:
                transaction.paymentData.receiver.routingNumber || null,
              routingNumberISPB:
                transaction.paymentData.receiver.routingNumberISPB || null,
            },
            create: {
              accountNumber:
                transaction.paymentData.receiver.accountNumber || null,
              branchNumber:
                transaction.paymentData.receiver.branchNumber || null,
              documentType:
                transaction.paymentData.receiver.documentNumber?.type || null,
              documentValue:
                transaction.paymentData.receiver.documentNumber?.value || null,
              name: transaction.paymentData.receiver.name || null,
              routingNumber:
                transaction.paymentData.receiver.routingNumber || null,
              routingNumberISPB:
                transaction.paymentData.receiver.routingNumberISPB || null,
              receiverPaymentDataId: paymentData.id,
            },
          })
        }
      }

      if (transaction.acquirerData) {
        await tx.acquirerData.upsert({
          where: { transactionId: transaction.id },
          update: {
            data: transaction.acquirerData.data || null,
          },
          create: {
            transactionId: transaction.id,
            data: transaction.acquirerData.data || null,
          },
        })
      }

      if (transaction.merchant) {
        await tx.merchant.upsert({
          where: { transactionId: transaction.id },
          update: {
            cnae: transaction.merchant.cnae || null,
            cnpj: transaction.merchant.cnpj || null,
            name: transaction.merchant.name || null,
            category: transaction.merchant.category || null,
            businessName: transaction.merchant.businessName || null,
          },
          create: {
            transactionId: transaction.id,
            cnae: transaction.merchant.cnae || null,
            cnpj: transaction.merchant.cnpj || null,
            name: transaction.merchant.name || null,
            category: transaction.merchant.category || null,
            businessName: transaction.merchant.businessName || null,
          },
        })
      }
    })
  }
}
