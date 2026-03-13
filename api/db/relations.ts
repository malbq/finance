import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

const tablesOnlySchema = {
  accounts: schema.account,
  bankData: schema.bankData,
  creditData: schema.creditData,
  transactions: schema.transaction,
  paymentData: schema.paymentData,
  paymentParticipants: schema.paymentParticipant,
  creditCardMetadata: schema.creditCardMetadata,
  acquirerData: schema.acquirerData,
  merchants: schema.merchant,
  investments: schema.investment,
  investmentTransactions: schema.investmentTransaction,
  categories: schema.category,
  spendingGoals: schema.spendingGoal,
}

export const relations = defineRelations(tablesOnlySchema, (r) => ({

  accounts: {
    transactions: r.many.transactions({
      from: r.accounts.id,
      to: r.transactions.accountId,
    }),
    bankData: r.one.bankData({
      from: r.accounts.id,
      to: r.bankData.accountId,
    }),
    creditData: r.one.creditData({
      from: r.accounts.id,
      to: r.creditData.accountId,
    }),
  },
  transactions: {
    account: r.one.accounts({
      from: r.transactions.accountId,
      to: r.accounts.id,
    }),
    paymentData: r.one.paymentData({
      from: r.transactions.id,
      to: r.paymentData.transactionId,
    }),
    creditCardMetadata: r.one.creditCardMetadata({
      from: r.transactions.id,
      to: r.creditCardMetadata.transactionId,
    }),
    acquirerData: r.one.acquirerData({
      from: r.transactions.id,
      to: r.acquirerData.transactionId,
    }),
    merchant: r.one.merchants({
      from: r.transactions.id,
      to: r.merchants.transactionId,
    }),
  },
  paymentData: {
    transaction: r.one.transactions({
      from: r.paymentData.transactionId,
      to: r.transactions.id,
    }),
    payer: r.one.paymentParticipants({
      from: r.paymentData.id,
      to: r.paymentParticipants.payerPaymentDataId,
      alias: 'payer',
    }),
    receiver: r.one.paymentParticipants({
      from: r.paymentData.id,
      to: r.paymentParticipants.receiverPaymentDataId,
      alias: 'receiver',
    }),
  },
  paymentParticipants: {
    payerPaymentData: r.one.paymentData({
      from: r.paymentParticipants.payerPaymentDataId,
      to: r.paymentData.id,
      alias: 'payerPaymentData',
    }),
    receiverPaymentData: r.one.paymentData({
      from: r.paymentParticipants.receiverPaymentDataId,
      to: r.paymentData.id,
      alias: 'receiverPaymentData',
    }),
  },
  bankData: {
    account: r.one.accounts({
      from: r.bankData.accountId,
      to: r.accounts.id,
    }),
  },
  creditData: {
    account: r.one.accounts({
      from: r.creditData.accountId,
      to: r.accounts.id,
    }),
  },
  creditCardMetadata: {
    transaction: r.one.transactions({
      from: r.creditCardMetadata.transactionId,
      to: r.transactions.id,
    }),
  },
  acquirerData: {
    transaction: r.one.transactions({
      from: r.acquirerData.transactionId,
      to: r.transactions.id,
    }),
  },
  merchants: {
    transaction: r.one.transactions({
      from: r.merchants.transactionId,
      to: r.transactions.id,
    }),
  },
  investments: {
    transactions: r.many.investmentTransactions({
      from: r.investments.id,
      to: r.investmentTransactions.investmentId,
    }),
  },
  investmentTransactions: {
    investment: r.one.investments({
      from: r.investmentTransactions.investmentId,
      to: r.investments.id,
    }),
  },
  categories: {
    parent: r.one.categories({
      from: r.categories.parentId,
      to: r.categories.id,
      alias: 'parent',
    }),
  },
  spendingGoals: {
    category: r.one.categories({
      from: r.spendingGoals.categoryId,
      to: r.categories.id,
    }),
  },
}))
