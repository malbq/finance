import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import {
  acquirerData,
  creditCardMetadata,
  merchants,
  paymentData,
  paymentParticipants,
  transactions,
} from '../db/schema'
import { PluggyClient } from './PluggyClient'
import { PluggyDataMapper, type PluggyAccount, type PluggyTransaction } from './PluggyDataMapper'

export class TransactionSyncService {
  constructor(private db: ReturnType<typeof drizzle>, private apiKey: string) {}

  async syncTransactions(accounts: PluggyAccount[]): Promise<void> {
    for (const account of accounts) {
      try {
        await this.syncAccountTransactions(account)
      } catch (error) {
        console.error(`Failed to sync transactions for account ${account.id}:`, error)
        throw error
      }
    }
  }

  private async syncAccountTransactions(account: PluggyAccount): Promise<void> {
    const params: Record<string, string> = {
      accountId: account.id,
      pageSize: '500',
    }

    params.from = '2025-06-20'

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

  private async syncSingleTransaction(transaction: PluggyTransaction): Promise<void> {
    await this.db.transaction(async (tx) => {
      const existingTransactionResult = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transaction.id))
        .limit(1)

      if (existingTransactionResult.length > 0) {
        return
      }

      const rawTransactionData = PluggyDataMapper.mapTransactionToDatabase(transaction)
      const transactionData = {
        ...rawTransactionData,
        type: rawTransactionData.type || 'DEBIT',
        status: rawTransactionData.status || 'POSTED',
      }

      await tx.insert(transactions).values(transactionData)

      if (transaction.creditCardMetadata) {
        await tx.insert(creditCardMetadata).values({
          transactionId: transaction.id,
          data: JSON.stringify(transaction.creditCardMetadata),
        })
      }

      if (transaction.paymentData) {
        const [paymentDataResult] = await tx
          .insert(paymentData)
          .values({
            transactionId: transaction.id,
            paymentMethod: transaction.paymentData.paymentMethod || null,
            reason: transaction.paymentData.reason || null,
            receiverReferenceId: transaction.paymentData.receiverReferenceId || null,
            referenceNumber: transaction.paymentData.referenceNumber || null,
            boletoMetadata: transaction.paymentData.boletoMetadata || null,
          })
          .returning()

        if (!paymentDataResult) {
          throw new Error('Failed to create payment data')
        }

        if (transaction.paymentData.payer) {
          await tx.insert(paymentParticipants).values({
            accountNumber: transaction.paymentData.payer.accountNumber || null,
            branchNumber: transaction.paymentData.payer.branchNumber || null,
            documentType: transaction.paymentData.payer.documentNumber?.type || null,
            documentValue: transaction.paymentData.payer.documentNumber?.value || null,
            name: transaction.paymentData.payer.name || null,
            routingNumber: transaction.paymentData.payer.routingNumber || null,
            routingNumberISPB: transaction.paymentData.payer.routingNumberISPB || null,
            payerPaymentDataId: paymentDataResult.id,
          })
        }

        if (transaction.paymentData.receiver) {
          await tx.insert(paymentParticipants).values({
            accountNumber: transaction.paymentData.receiver.accountNumber || null,
            branchNumber: transaction.paymentData.receiver.branchNumber || null,
            documentType: transaction.paymentData.receiver.documentNumber?.type || null,
            documentValue: transaction.paymentData.receiver.documentNumber?.value || null,
            name: transaction.paymentData.receiver.name || null,
            routingNumber: transaction.paymentData.receiver.routingNumber || null,
            routingNumberISPB: transaction.paymentData.receiver.routingNumberISPB || null,
            receiverPaymentDataId: paymentDataResult.id,
          })
        }
      }

      if (transaction.acquirerData) {
        await tx.insert(acquirerData).values({
          transactionId: transaction.id,
          data: transaction.acquirerData.data || null,
        })
      }

      if (transaction.merchant) {
        await tx.insert(merchants).values({
          transactionId: transaction.id,
          cnae: transaction.merchant.cnae || null,
          cnpj: transaction.merchant.cnpj || null,
          name: transaction.merchant.name || null,
          category: transaction.merchant.category || null,
          businessName: transaction.merchant.businessName || null,
        })
      }
    })
  }
}
