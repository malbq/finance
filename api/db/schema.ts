import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const accountType = ['BANK', 'CREDIT'] as const
export const accountSubtype = ['CHECKING_ACCOUNT', 'CREDIT_CARD', 'SAVINGS_ACCOUNT'] as const
export const investmentType = [
  'COE',
  'EQUITY',
  'ETF',
  'FIXED_INCOME',
  'MUTUAL_FUND',
  'SECURITY',
  'OTHER',
] as const
export const investmentSubtype = [
  'STRUCTURED_NOTE',
  'STOCK',
  'ETF',
  'REAL_ESTATE_FUND',
  'BDR',
  'DERIVATIVES',
  'OPTION',
  'TREASURY',
  'LCI',
  'LCA',
  'LF',
  'CDB',
  'CRI',
  'CRA',
  'CORPORATE_DEBT',
  'LC',
  'DEBENTURES',
  'INVESTMENT_FUND',
  'MULTIMARKET_FUND',
  'FIXED_INCOME_FUND',
  'STOCK_FUND',
  'ETF_FUND',
  'OFFSHORE_FUND',
  'FIP_FUND',
  'EXCHANGE_FUND',
  'RETIREMENT',
  'OTHER',
] as const
export const investmentStatus = ['ACTIVE', 'PENDING', 'TOTAL_WITHDRAWAL'] as const
export const investmentTransactionType = [
  'BUY',
  'SELL',
  'TAX',
  'TRANSFER',
  'INTEREST',
  'AMORTIZATION',
] as const
export const movementType = ['CREDIT', 'DEBIT'] as const
export const transactionType = ['CREDIT', 'DEBIT'] as const
export const transactionStatus = ['POSTED', 'PENDING'] as const

export const account = sqliteTable('Account', {
  id: text('id').primaryKey(),
  itemId: text('itemId').notNull(),
  number: text('number'),
  type: text('type', { enum: accountType }).notNull(),
  subtype: text('subtype', { enum: accountSubtype }),
  name: text('name').notNull(),
  balance: real('balance').notNull(),
  currencyCode: text('currencyCode').default('BRL').notNull(),
  marketingName: text('marketingName'),
  taxNumber: text('taxNumber'),
  owner: text('owner'),
  createdAt: integer('createdAt', { mode: 'number' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'number' }).notNull(),
})

export const bankData = sqliteTable('BankData', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text('accountId')
    .notNull()
    .references(() => account.id)
    .unique(),
  transferNumber: text('transferNumber'),
  closingBalance: real('closingBalance'),
  automaticallyInvestedBalance: real('automaticallyInvestedBalance'),
  overdraftContractedLimit: real('overdraftContractedLimit'),
  overdraftUsedLimit: real('overdraftUsedLimit'),
  unarrangedOverdraftAmount: real('unarrangedOverdraftAmount'),
})

export const creditData = sqliteTable('CreditData', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text('accountId')
    .notNull()
    .references(() => account.id)
    .unique(),
  level: text('level').notNull(),
  brand: text('brand').notNull(),
  balanceCloseDate: integer('balanceCloseDate', { mode: 'number' }),
  balanceDueDate: integer('balanceDueDate', { mode: 'number' }).notNull(),
  availableCreditLimit: real('availableCreditLimit').notNull(),
  balanceForeignCurrency: real('balanceForeignCurrency'),
  minimumPayment: real('minimumPayment'),
  creditLimit: real('creditLimit').notNull(),
  isLimitFlexible: integer('isLimitFlexible', { mode: 'boolean' }),
  holderType: text('holderType'),
  status: text('status'),
})

export const transaction = sqliteTable(
  'Transaction',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId')
      .notNull()
      .references(() => account.id),
    description: text('description').notNull(),
    descriptionRaw: text('descriptionRaw'),
    currencyCode: text('currencyCode').default('BRL').notNull(),
    amount: real('amount').notNull(),
    amountInAccountCurrency: real('amountInAccountCurrency'),
    date: integer('date', { mode: 'number' }).notNull(),
    category: text('category'),
    categoryId: text('categoryId'),
    balance: real('balance'),
    providerCode: text('providerCode'),
    status: text('status', { enum: transactionStatus }).notNull(),
    type: text('type', { enum: transactionType }).notNull(),
    operationType: text('operationType'),
    providerId: text('providerId'),
    createdAt: integer('createdAt', { mode: 'number' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'number' }).notNull(),
  },
  (table) => [index('account_idx').on(table.accountId), index('date_idx').on(table.date)]
)

export const paymentData = sqliteTable('PaymentData', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transactionId')
    .notNull()
    .references(() => transaction.id)
    .unique(),
  paymentMethod: text('paymentMethod'),
  reason: text('reason'),
  receiverReferenceId: text('receiverReferenceId'),
  referenceNumber: text('referenceNumber'),
  boletoMetadata: text('boletoMetadata'),
})

export const paymentParticipant = sqliteTable('PaymentParticipant', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountNumber: text('accountNumber'),
  branchNumber: text('branchNumber'),
  documentType: text('documentType'),
  documentValue: text('documentValue'),
  name: text('name'),
  routingNumber: text('routingNumber'),
  routingNumberISPB: text('routingNumberISPB'),
  payerPaymentDataId: text('payerPaymentDataId')
    .references(() => paymentData.id)
    .unique(),
  receiverPaymentDataId: text('receiverPaymentDataId')
    .references(() => paymentData.id)
    .unique(),
})

export const creditCardMetadata = sqliteTable('CreditCardMetadata', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transactionId')
    .notNull()
    .references(() => transaction.id)
    .unique(),
  data: text('data'),
})

export const acquirerData = sqliteTable('AcquirerData', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transactionId')
    .notNull()
    .references(() => transaction.id)
    .unique(),
  data: text('data'),
})

export const merchant = sqliteTable('Merchant', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transactionId')
    .notNull()
    .references(() => transaction.id)
    .unique(),
  cnae: text('cnae'),
  cnpj: text('cnpj'),
  name: text('name'),
  category: text('category'),
  businessName: text('businessName'),
})

export const investment = sqliteTable(
  'Investment',
  {
    id: text('id').primaryKey(),
    itemId: text('itemId').notNull(),
    type: text('type', { enum: investmentType }).notNull(),
    subtype: text('subtype', { enum: investmentSubtype }),
    number: text('number'),
    balance: real('balance').notNull(),
    name: text('name').notNull(),
    lastMonthRate: real('lastMonthRate'),
    lastTwelveMonthsRate: real('lastTwelveMonthsRate'),
    annualRate: real('annualRate'),
    currencyCode: text('currencyCode').default('BRL').notNull(),
    code: text('code'),
    isin: text('isin'),
    value: real('value'),
    quantity: real('quantity'),
    amount: real('amount'),
    taxes: real('taxes'),
    taxes2: real('taxes2'),
    date: integer('date', { mode: 'number' }).notNull(),
    owner: text('owner'),
    amountProfit: real('amountProfit'),
    amountWithdrawal: real('amountWithdrawal'),
    amountOriginal: real('amountOriginal'),
    dueDate: integer('dueDate', { mode: 'number' }),
    issuer: text('issuer'),
    issuerCNPJ: text('issuerCNPJ'),
    issueDate: integer('issueDate', { mode: 'number' }),
    rate: real('rate'),
    rateType: text('rateType'),
    fixedAnnualRate: real('fixedAnnualRate'),
    status: text('status', { enum: investmentStatus }),
    institution: text('institution'),
    metadata: text('metadata'),
    createdAt: integer('createdAt', { mode: 'number' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'number' }).notNull(),
  },
  (table) => [index('itemId_id_idx').on(table.itemId, table.id)]
)

export const investmentTransaction = sqliteTable('InvestmentTransaction', {
  id: text('id').primaryKey(),
  investmentId: text('investmentId')
    .notNull()
    .references(() => investment.id),
  type: text('type', { enum: investmentTransactionType }).notNull(),
  movementType: text('movementType', { enum: movementType }),
  quantity: real('quantity'),
  value: real('value'),
  amount: real('amount'),
  netAmount: real('netAmount'),
  description: text('description'),
  agreedRate: real('agreedRate'),
  date: integer('date', { mode: 'number' }).notNull(),
  tradeDate: integer('tradeDate', { mode: 'number' }),
  brokerageNumber: text('brokerageNumber'),
  expenses: text('expenses'),
})

export const category = sqliteTable('Category', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  descriptionTranslated: text('descriptionTranslated').notNull(),
  parentId: text('parentId'),
  parentDescription: text('parentDescription'),
})

export const spendingGoal = sqliteTable('SpendingGoal', {
  categoryId: text('categoryId').primaryKey(),
  goal: real('goal'),
  tolerance: integer('tolerance'),
  updatedAt: integer('updatedAt', { mode: 'number' }).notNull(),
})

// Types
export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert

export type BankData = typeof bankData.$inferSelect
export type NewBankData = typeof bankData.$inferInsert

export type CreditData = typeof creditData.$inferSelect
export type NewCreditData = typeof creditData.$inferInsert

export type Transaction = typeof transaction.$inferSelect
export type NewTransaction = typeof transaction.$inferInsert

export type PaymentData = typeof paymentData.$inferSelect
export type NewPaymentData = typeof paymentData.$inferInsert

export type PaymentParticipant = typeof paymentParticipant.$inferSelect
export type NewPaymentParticipant = typeof paymentParticipant.$inferInsert

export type CreditCardMetadata = typeof creditCardMetadata.$inferSelect
export type NewCreditCardMetadata = typeof creditCardMetadata.$inferInsert

export type AcquirerData = typeof acquirerData.$inferSelect
export type NewAcquirerData = typeof acquirerData.$inferInsert

export type Merchant = typeof merchant.$inferSelect
export type NewMerchant = typeof merchant.$inferInsert

export type Investment = typeof investment.$inferSelect
export type NewInvestment = typeof investment.$inferInsert

export type InvestmentTransaction = typeof investmentTransaction.$inferSelect
export type NewInvestmentTransaction = typeof investmentTransaction.$inferInsert

export type Category = typeof category.$inferSelect
export type NewCategory = typeof category.$inferInsert

export type SpendingGoal = typeof spendingGoal.$inferSelect
export type NewSpendingGoal = typeof spendingGoal.$inferInsert
