import { aliasedTable, and, desc, eq, gte, lte } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { Account } from '../domain/Account'
import type { Category } from '../domain/Categories'
import type { Transaction } from '../domain/Transaction'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { formatTime } from '../utils/formatTime'
import {
  accounts,
  acquirerData,
  categories,
  creditCardMetadata,
  creditData,
  merchants,
  movingAverageProjections,
  paymentData,
  paymentParticipants,
  transactions,
} from './db/schema'

export interface BootstrapData {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  movingAverages: {
    totalMonthlyIncome: number
    totalMonthlySpending: number
    expectedSavings: number
  }
  generatedAt: number
  range: {
    from: number
    to: number
  }
}

type Db = ReturnType<typeof drizzle>

export function createBootstrapHandler(db: Db) {
  return {
    async GET() {
      return await getBootstrapData(db)
        .then((data) => Response.json(data))
        .catch((error) => {
          console.error('[API] Bootstrap API error:', error)
          return Response.json({ error: 'Failed to fetch bootstrap data' }, { status: 500 })
        })
    },
  }
}

async function getBootstrapData(db: Db): Promise<BootstrapData> {
  const now = Date.now()
  const nowDate = new Date(now)
  const from = new Date(nowDate.getFullYear(), nowDate.getMonth() - 6, 1).getTime()
  const to = now

  // Load all data in parallel for efficiency
  const [accountsData, categoriesData, transactionsData, projectionsData] = await Promise.all([
    loadAccounts(db),
    loadCategories(db),
    loadTransactionsInRange(db, from, to),
    loadProjections(db),
  ])

  return {
    accounts: accountsData,
    categories: categoriesData,
    transactions: transactionsData,
    movingAverages: projectionsData,
    generatedAt: now,
    range: { from, to },
  }
}

async function loadAccounts(db: Db): Promise<Account[]> {
  const result = await db
    .select({
      account: accounts,
      creditData: creditData,
    })
    .from(accounts)
    .leftJoin(creditData, eq(accounts.id, creditData.accountId))
    .orderBy(accounts.type, accounts.itemId)

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

async function loadCategories(db: Db): Promise<Category[]> {
  const result = await db
    .select()
    .from(categories)
    .orderBy(categories.parentId, categories.description)

  return result.map((category) => ({
    id: category.id,
    description: category.description,
    descriptionTranslated: category.descriptionTranslated,
    parentId: category.parentId ?? undefined,
    parentDescription: category.parentDescription ?? undefined,
  }))
}

/**
 * Load all transactions within the date range with a single efficient query.
 * This avoids the N+1 problem of loading transactions per-account.
 */
async function loadTransactionsInRange(
  db: Db,
  from: number,
  to: number
): Promise<Transaction[]> {
  const payer = aliasedTable(paymentParticipants, 'payer')
  const receiver = aliasedTable(paymentParticipants, 'receiver')

  const result = await db
    .select({
      transaction: transactions,
      account: { type: accounts.type },
      paymentData: paymentData,
      payer: payer,
      receiver: receiver,
      creditCardMetadata: creditCardMetadata,
      acquirerData: acquirerData,
      merchant: merchants,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(paymentData, eq(transactions.id, paymentData.transactionId))
    .leftJoin(payer, eq(paymentData.id, payer.payerPaymentDataId))
    .leftJoin(receiver, eq(paymentData.id, receiver.receiverPaymentDataId))
    .leftJoin(creditCardMetadata, eq(transactions.id, creditCardMetadata.transactionId))
    .leftJoin(acquirerData, eq(transactions.id, acquirerData.transactionId))
    .leftJoin(merchants, eq(transactions.id, merchants.transactionId))
    .where(and(gte(transactions.date, from), lte(transactions.date, to)))
    .orderBy(desc(transactions.date))

  // Group results by transaction ID since joins can create duplicates
  const transactionMap = new Map<string, {
    transaction: typeof transactions.$inferSelect
    account: { type: string } | null
    paymentData: typeof paymentData.$inferSelect | null
    creditCardMetadata: typeof creditCardMetadata.$inferSelect | null
    acquirerData: typeof acquirerData.$inferSelect | null
    merchant: typeof merchants.$inferSelect | null
    payers: (typeof paymentParticipants.$inferSelect)[]
    receivers: (typeof paymentParticipants.$inferSelect)[]
  }>()

  for (const row of result) {
    const transactionId = row.transaction.id

    if (!transactionMap.has(transactionId)) {
      transactionMap.set(transactionId, {
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

    const tx = transactionMap.get(transactionId)!

    if (row.payer && row.paymentData) {
      tx.payers.push(row.payer)
    }
    if (row.receiver && row.paymentData) {
      tx.receivers.push(row.receiver)
    }
  }

  return Array.from(transactionMap.values()).map(mapTransactionToEntity)
}

function mapTransactionToEntity(row: {
  transaction: typeof transactions.$inferSelect
  account: { type: string } | null
  paymentData: typeof paymentData.$inferSelect | null
  creditCardMetadata: typeof creditCardMetadata.$inferSelect | null
  acquirerData: typeof acquirerData.$inferSelect | null
  merchant: typeof merchants.$inferSelect | null
  payers: (typeof paymentParticipants.$inferSelect)[]
  receivers: (typeof paymentParticipants.$inferSelect)[]
}): Transaction {
  const transactionData = row.transaction
  const accountType = row.account?.type

  const metadata = row.creditCardMetadata?.data
    ? JSON.parse(row.creditCardMetadata.data)
    : undefined

  const normalizedAmount =
    accountType === 'BANK' ? transactionData.amount : transactionData.amount * -1

  return {
    id: transactionData.id,
    accountId: transactionData.accountId,
    description: transactionData.description,
    descriptionRaw: transactionData.descriptionRaw ?? undefined,
    currencyCode: transactionData.currencyCode,
    amount: normalizedAmount,
    amountFormatted: formatCurrency(normalizedAmount),
    date: new Date(transactionData.date),
    dateFormatted: formatDate(new Date(transactionData.date)),
    timeFormatted: formatTime(new Date(transactionData.date)),
    futurePayment: new Date(transactionData.date) > new Date(),
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
}

async function loadProjections(db: Db) {
  const projections = await db.select().from(movingAverageProjections)

  const spendingProjection = projections.find((p) => p.category === 'Spending')
  const totalMonthlySpending = spendingProjection?.value || 0

  const incomeProjection = projections.find((p) => p.category === 'Income')
  const totalMonthlyIncome = incomeProjection?.value || 0

  return {
    totalMonthlyIncome,
    totalMonthlySpending,
    expectedSavings: totalMonthlyIncome - totalMonthlySpending,
  }
}
