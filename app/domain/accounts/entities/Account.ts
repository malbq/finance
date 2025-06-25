export type AccountType = 'BANK' | 'CREDIT'

export type AccountSubtype =
  | 'CHECKING_ACCOUNT'
  | 'SAVINGS_ACCOUNT'
  | 'CREDIT_CARD'

export interface Account {
  id: string
  type: AccountType
  subtype?: AccountSubtype
  name: string
  balance: number
  balanceFormatted: string
  currencyCode: string
  creditData?: CreditDataInfo
}

export interface CreditDataInfo {
  level: string
  brand: string
  balanceDueDate: Date
  creditLimit: number
  creditLimitFormatted: string
  availableCreditLimit: number
  availableCreditLimitFormatted: string
  status?: string
}
