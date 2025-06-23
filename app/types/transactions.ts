import type { LoaderFunctionArgs } from 'react-router'

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs
  export interface LoaderData {
    transactions: Array<{
      id: string
      bankId: string
      accountId: string
      transactionType: string
      postedDate: string
      amount: number
      currency: string
      fitId: string | null
      checkNum: string | null
      memo: string | null
    }>
    error?: string
  }
}

export interface PaymentParticipant {
  id: string
  accountNumber: string | null
  branchNumber: string | null
  documentType: string | null
  documentValue: string | null
  name: string | null
  routingNumber: string | null
  routingNumberISPB: string | null
}

export interface PaymentData {
  id: string
  paymentMethod: string | null
  reason: string | null
  receiverReferenceId: string | null
  referenceNumber: string | null
  boletoMetadata: string | null
  payer: PaymentParticipant | null
  receiver: PaymentParticipant | null
}

export interface Merchant {
  id: string
  cnae: string | null
  cnpj: string | null
  name: string | null
  category: string | null
  businessName: string | null
}

export interface TransactionWithMetadata {
  id: string
  description: string
  dateFormatted: string
  timeFormatted: string
  categoryIcon: string
  category: string | null
  categoryId: string | null
  amountFormatted: string
  balanceFormatted: string | null
  status: string | null
  paymentData: PaymentData | null
  merchant: Merchant | null
  installmentNumber?: number
  totalInstallments?: number
  originalPurchaseDateFormatted: string | null
  amount: number
  futurePayment: boolean
}

export interface Account {
  id: string
  name: string
  type: 'BANK' | 'CREDIT'
  balance: number
  balanceFormatted: string
  transactions: TransactionWithMetadata[]
  creditData?: {
    creditLimit: number | null
    creditLimitFormatted: string | null
    availableCreditLimit: number | null
    availableCreditLimitFormatted: string | null
  } | null
}
