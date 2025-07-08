import type { CategoryId, CategoryName } from './Categories'

export type TransactionType = 'CREDIT' | 'DEBIT'

export type TransactionStatus = 'POSTED' | 'PENDING'

export interface PaymentParticipantData {
  id: string
  accountNumber?: string
  branchNumber?: string
  documentType?: string
  documentValue?: string
  name?: string
  routingNumber?: string
  routingNumberISPB?: string
}

export interface PaymentData {
  id: string
  transactionId: string
  paymentMethod?: string
  payer?: PaymentParticipantData
  receiver?: PaymentParticipantData
}

export interface CreditCardMetadata {
  id: string
  transactionId: string
  cardNumber?: string
  purchaseDate?: Date
  purchaseDateFormatted?: string
  purchaseTimeFormatted?: string
  totalInstallments?: number
  installmentNumber?: number
}

export interface MerchantData {
  id: string
  transactionId: string
  cnae?: string
  cnpj?: string
  name?: string
  category?: string
  businessName?: string
}

export interface Transaction {
  id: string
  accountId: string
  description: string
  descriptionRaw?: string
  currencyCode: string
  amount: number
  amountFormatted: string
  date: Date
  dateFormatted: string
  timeFormatted: string
  futurePayment: boolean
  category?: CategoryName
  categoryId?: CategoryId
  balance?: number
  status?: TransactionStatus
  type?: TransactionType
  operationType?: string
  createdAt: Date
  updatedAt: Date
  paymentData?: PaymentData
  creditCardMetadata?: CreditCardMetadata
  merchant?: MerchantData
}
