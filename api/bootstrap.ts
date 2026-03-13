import { aliasedTable, and, desc, eq, gt, gte, max } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { Account } from '../domain/Account'
import type { CategoryId } from '../domain/Categories'
import type { Transaction } from '../domain/Transaction'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { formatTime } from '../utils/formatTime'
import {
  account,
  acquirerData,
  creditCardMetadata,
  creditData,
  merchant,
  paymentData,
  paymentParticipant,
  spendingGoal,
  transaction,
} from './db/schema'

export interface BootstrapData {
  accounts: Account[]
  transactions: Transaction[]
  spendingGoals: Partial<
    Record<
      CategoryId,
      {
        goal: number | null
        tolerance: number | null
      }
    >
  >
  /** Cursor for delta sync: max Transaction.updatedAt in DB window */
  cursor: number
  /** True if this is a delta response (since param was provided) */
  isDelta: boolean
}

type Db = ReturnType<typeof drizzle>

/** Raw row returned by the transaction JOIN query — one row per payer/receiver pair */
type RawTransactionRow = {
  transaction: typeof transaction.$inferSelect
  account: { type: string } | null
  paymentData: typeof paymentData.$inferSelect | null
  payer: typeof paymentParticipant.$inferSelect | null
  receiver: typeof paymentParticipant.$inferSelect | null
  creditCardMetadata: typeof creditCardMetadata.$inferSelect | null
  acquirerData: typeof acquirerData.$inferSelect | null
  merchant: typeof merchant.$inferSelect | null
}

/** Grouped transaction row with all payers/receivers collected */
type TransactionRow = Omit<RawTransactionRow, 'payer' | 'receiver'> & {
  payers: (typeof paymentParticipant.$inferSelect)[]
  receivers: (typeof paymentParticipant.$inferSelect)[]
}

export function createBootstrapHandler(db: Db) {
  return {
    async GET(request: Request) {
      const url = new URL(request.url)
      const sinceParam = url.searchParams.get('since')
      const since = sinceParam ? Number(sinceParam) : undefined

      return await getBootstrapData(db, since)
        .then((data) => Response.json(data))
        .catch((error) => {
          console.error('[API] Bootstrap API error:', error)
          return Response.json({ error: 'Failed to fetch bootstrap data' }, { status: 500 })
        })
    },
  }
}

async function getBootstrapData(db: Db, since?: number): Promise<BootstrapData> {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime()
  const isDelta = since !== undefined

  // Load data based on whether this is a full load or delta
  const [accountsData, transactionsData, goalsData, cursorValue] = await Promise.all([
    loadAccounts(db),
    isDelta ? loadTransactionsDelta(db, from, since) : loadTransactionsInRange(db, from),
    loadSpendingGoals(db, since),
    getMaxUpdatedAt(db, from),
  ])

  return {
    accounts: accountsData,
    transactions: transactionsData,
    spendingGoals: goalsData,
    cursor: cursorValue,
    isDelta,
  }
}

/**
 * Get the max updatedAt timestamp for transactions in the window.
 * This is used as the cursor for delta sync.
 */
async function getMaxUpdatedAt(db: Db, from: number): Promise<number> {
  const result = await db
    .select({ maxUpdatedAt: max(transaction.updatedAt) })
    .from(transaction)
    .where(gte(transaction.date, from))

  return result[0]?.maxUpdatedAt ?? 0
}

async function loadSpendingGoals(
  db: Db,
  since?: number
): Promise<BootstrapData['spendingGoals']> {
  const rows = await db
    .select({
      categoryId: spendingGoal.categoryId,
      goal: spendingGoal.goal,
      tolerance: spendingGoal.tolerance,
    })
    .from(spendingGoal)
    .where(since !== undefined ? gt(spendingGoal.updatedAt, since) : undefined)

  return Object.fromEntries(
    rows.map((row) => [
      row.categoryId as CategoryId,
      { goal: row.goal ?? null, tolerance: row.tolerance ?? null },
    ])
  )
}

async function loadAccounts(db: Db): Promise<Account[]> {
  const result = await db
    .select({
      account: account,
      creditData: creditData,
    })
    .from(account)
    .leftJoin(creditData, eq(account.id, creditData.accountId))
    .orderBy(account.type, account.itemId)

  return result.map((row) => {
    const accountData = row.account
    const credit = row.creditData

    const account: Account = {
      id: accountData.id,
      type: accountData.type,
      subtype: accountData.subtype ?? undefined,
      name: accountData.name,
      balance: accountData.balance,
      balanceFormatted: formatCurrency(accountData.balance),
      currencyCode: accountData.currencyCode,
    }

    if (accountData.type === 'CREDIT' && credit) {
      account.creditData = {
        level: credit.level,
        brand: credit.brand,
        balanceDueDate: new Date(credit.balanceDueDate),
        creditLimit: credit.creditLimit,
        creditLimitFormatted: formatCurrency(credit.creditLimit),
        availableCreditLimit: credit.availableCreditLimit,
        availableCreditLimitFormatted: formatCurrency(credit.availableCreditLimit),
      }
    }

    return account
  })
}

/**
 * Load all transactions within the date range with a single efficient query.
 * This avoids the N+1 problem of loading transactions per-account.
 */
async function loadTransactionsInRange(db: Db, from: number): Promise<Transaction[]> {
  const payer = aliasedTable(paymentParticipant, 'payer')
  const receiver = aliasedTable(paymentParticipant, 'receiver')

  const rows = await db
    .select({
      transaction,
      account: { type: account.type },
      paymentData,
      payer,
      receiver,
      creditCardMetadata,
      acquirerData,
      merchant,
    })
    .from(transaction)
    .leftJoin(account, eq(transaction.accountId, account.id))
    .leftJoin(paymentData, eq(transaction.id, paymentData.transactionId))
    .leftJoin(payer, eq(paymentData.id, payer.payerPaymentDataId))
    .leftJoin(receiver, eq(paymentData.id, receiver.receiverPaymentDataId))
    .leftJoin(creditCardMetadata, eq(transaction.id, creditCardMetadata.transactionId))
    .leftJoin(acquirerData, eq(transaction.id, acquirerData.transactionId))
    .leftJoin(merchant, eq(transaction.id, merchant.transactionId))
    .where(gte(transaction.date, from))
    .orderBy(desc(transaction.date))

  return groupTransactionRows(rows).map(mapTransactionToEntity)
}

/**
 * Load transactions that have been updated since the given timestamp (delta sync).
 * Only returns transactions from `from` onwards that have updatedAt > since.
 */
async function loadTransactionsDelta(
  db: Db,
  from: number,
  since: number
): Promise<Transaction[]> {
  const payer = aliasedTable(paymentParticipant, 'payer')
  const receiver = aliasedTable(paymentParticipant, 'receiver')

  const rows = await db
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
    .where(and(gte(transaction.date, from), gt(transaction.updatedAt, since)))
    .orderBy(desc(transaction.date))

  return groupTransactionRows(rows).map(mapTransactionToEntity)
}

/**
 * Joins produce multiple rows per transaction when there are multiple payers/receivers.
 * This groups them back into a single TransactionRow per transaction ID.
 */
function groupTransactionRows(rows: RawTransactionRow[]): TransactionRow[] {
  const byId = new Map<string, TransactionRow>()

  for (const row of rows) {
    if (!byId.has(row.transaction.id)) {
      byId.set(row.transaction.id, {
        transaction: row.transaction,
        account: row.account,
        paymentData: row.paymentData,
        creditCardMetadata: row.creditCardMetadata,
        acquirerData: row.acquirerData,
        merchant: row.merchant,
        payers: [],
        receivers: [],
      })
    }

    const tx = byId.get(row.transaction.id)!
    if (row.payer && row.paymentData) tx.payers.push(row.payer)
    if (row.receiver && row.paymentData) tx.receivers.push(row.receiver)
  }

  return Array.from(byId.values())
}

function mapTransactionToEntity(row: TransactionRow): Transaction {
  const transactionData = row.transaction
  const accountType = row.account?.type

  const metadata = row.creditCardMetadata?.data
    ? JSON.parse(row.creditCardMetadata.data)
    : undefined
  const purchaseDate = metadata?.purchaseDate ? new Date(metadata.purchaseDate) : undefined

  const normalizedAmount =
    accountType === 'BANK' ? transactionData.amount : transactionData.amount * -1
  const date = new Date(transactionData.date)

  return {
    id: transactionData.id,
    accountId: transactionData.accountId,
    description: transactionData.description,
    descriptionRaw: transactionData.descriptionRaw ?? undefined,
    currencyCode: transactionData.currencyCode,
    amount: normalizedAmount,
    amountFormatted: formatCurrency(normalizedAmount),
    date,
    dateFormatted: formatDate(date),
    timeFormatted: formatTime(date),
    futurePayment: date > new Date(),
    category: (transactionData.category ?? undefined) as Transaction['category'],
    categoryId: (transactionData.categoryId ?? undefined) as Transaction['categoryId'],
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
          payer: row.payers[0]
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
          receiver: row.receivers[0]
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
          purchaseDateFormatted: purchaseDate ? formatDate(purchaseDate) : undefined,
          purchaseTimeFormatted: purchaseDate ? formatTime(purchaseDate) : undefined,
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
}
