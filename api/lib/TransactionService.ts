import { aliasedTable, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { CategoryId, CategoryName } from '../../domain/Categories'
import type { Transaction } from '../../domain/Transaction'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { formatTime } from '../../utils/formatTime'
import {
  account,
  acquirerData,
  creditCardMetadata,
  merchant,
  paymentData,
  paymentParticipant,
  transaction,
} from '../db/schema'

export class TransactionService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const payer = aliasedTable(paymentParticipant, 'payer')
    const receiver = aliasedTable(paymentParticipant, 'receiver')

    const result = await this.db
      .select({
        transaction: transaction,
        account: { type: account.type },
        paymentData: paymentData,
        payer: payer,
        receiver: receiver,
        creditCardMetadata: creditCardMetadata,
        acquirerData: acquirerData,
        merchant: merchant,
      })
      .from(transaction)
      .leftJoin(account, eq(transaction.accountId, account.id))
      .leftJoin(paymentData, eq(transaction.id, paymentData.transactionId))
      .leftJoin(payer, eq(paymentData.id, payer.payerPaymentDataId))
      .leftJoin(receiver, eq(paymentData.id, receiver.receiverPaymentDataId))
      .leftJoin(creditCardMetadata, eq(transaction.id, creditCardMetadata.transactionId))
      .leftJoin(acquirerData, eq(transaction.id, acquirerData.transactionId))
      .leftJoin(merchant, eq(transaction.id, merchant.transactionId))
      .where(eq(transaction.accountId, accountId))
      .orderBy(desc(transaction.date))

    // Group results by transaction ID since joins can create duplicates
    const transactionMap = new Map<string, any>()

    for (const row of result) {
      const transactionId = row.transaction.id

      if (!transactionMap.has(transactionId)) {
        transactionMap.set(transactionId, {
          ...row,
          payers: [],
          receivers: [],
        })
      }

      const transaction = transactionMap.get(transactionId)!

      // Handle payer/receiver relationships (this is simplified - in practice you might need more complex logic)
      if (row.payer && row.paymentData) {
        transaction.payers.push(row.payer)
      }
      if (row.receiver && row.paymentData) {
        transaction.receivers.push(row.receiver)
      }
    }

    return Array.from(transactionMap.values()).map(this.mapToEntity)
  }

  async updateCategory(id: string, categoryId: string): Promise<void> {
    await this.db.update(transaction).set({ categoryId }).where(eq(transaction.id, id))
  }

  private mapToEntity = (row: {
    transaction: typeof transaction.$inferSelect
    account: { type: string } | null
    paymentData: typeof paymentData.$inferSelect | null
    payer: typeof paymentParticipant.$inferSelect | null
    receiver: typeof paymentParticipant.$inferSelect | null
    creditCardMetadata: typeof creditCardMetadata.$inferSelect | null
    acquirerData: typeof acquirerData.$inferSelect | null
    merchant: typeof merchant.$inferSelect | null
    payers?: (typeof paymentParticipant.$inferSelect)[]
    receivers?: (typeof paymentParticipant.$inferSelect)[]
  }): Transaction => {
    const transactionData = row.transaction
    const accountType = row.account?.type

    const metadata = row.creditCardMetadata?.data
      ? JSON.parse(row.creditCardMetadata.data)
      : undefined

    const normalizedAmount =
      accountType === 'BANK' ? transactionData.amount : transactionData.amount * -1

    const transaction: Transaction = {
      id: transactionData.id,
      accountId: transactionData.accountId,
      description: transactionData.description,
      currencyCode: transactionData.currencyCode,
      amount: normalizedAmount,
      amountFormatted: formatCurrency(normalizedAmount),
      date: new Date(transactionData.date),
      dateFormatted: formatDate(new Date(transactionData.date)),
      timeFormatted: formatTime(new Date(transactionData.date)),
      futurePayment: new Date(transactionData.date) > new Date(),
      category: (transactionData.category ?? undefined) as CategoryName | undefined,
      categoryId: (transactionData.categoryId ?? undefined) as CategoryId | undefined,
      balance: transactionData.balance ?? undefined,
      status: transactionData.status,
      type: transactionData.type,
      operationType: transactionData.operationType ?? undefined,
      createdAt: new Date(transactionData.createdAt),
      updatedAt: new Date(transactionData.updatedAt),
      paymentData: row.paymentData
        ? {
            id: row.paymentData.id,
            transactionId: row.paymentData.transactionId,
            paymentMethod: row.paymentData.paymentMethod ?? undefined,
            payer: row.payers?.[0]
              ? {
                  id: row.payers[0].id,
                  accountNumber: row.payers[0].accountNumber ?? undefined,
                  branchNumber: row.payers[0].branchNumber ?? undefined,
                  documentValue: row.payers[0].documentValue ?? undefined,
                  name: row.payers[0].name ?? undefined,
                  routingNumber: row.payers[0].routingNumber ?? undefined,
                  routingNumberISPB: row.payers[0].routingNumberISPB ?? undefined,
                }
              : undefined,
            receiver: row.receivers?.[0]
              ? {
                  id: row.receivers[0].id,
                  accountNumber: row.receivers[0].accountNumber ?? undefined,
                  branchNumber: row.receivers[0].branchNumber ?? undefined,
                  documentType: row.receivers[0].documentType ?? undefined,
                  documentValue: row.receivers[0].documentValue ?? undefined,
                  name: row.receivers[0].name ?? undefined,
                  routingNumber: row.receivers[0].routingNumber ?? undefined,
                  routingNumberISPB: row.receivers[0].routingNumberISPB ?? undefined,
                }
              : undefined,
          }
        : undefined,
      creditCardMetadata: row.creditCardMetadata
        ? {
            id: row.creditCardMetadata.id,
            transactionId: row.creditCardMetadata.transactionId,
            cardNumber: metadata?.cardNumber ?? undefined,
            purchaseDate: metadata?.purchaseDate ?? undefined,
            purchaseDateFormatted: metadata?.purchaseDate
              ? formatDate(new Date(metadata.purchaseDate))
              : undefined,
            purchaseTimeFormatted: metadata?.purchaseDate
              ? formatTime(new Date(metadata.purchaseDate))
              : undefined,
            totalInstallments: metadata?.totalInstallments ?? undefined,
            installmentNumber: metadata?.installmentNumber ?? undefined,
          }
        : undefined,
      merchant: row.merchant
        ? {
            id: row.merchant.id,
            transactionId: row.merchant.transactionId,
            cnae: row.merchant.cnae ?? undefined,
            cnpj: row.merchant.cnpj ?? undefined,
            name: row.merchant.name ?? undefined,
            category: row.merchant.category ?? undefined,
            businessName: row.merchant.businessName ?? undefined,
          }
        : undefined,
    }

    return transaction
  }
}
