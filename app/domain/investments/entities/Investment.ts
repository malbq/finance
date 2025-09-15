export enum InvestmentType {
  COE = 'COE',
  EQUITY = 'EQUITY',
  ETF = 'ETF',
  FIXED_INCOME = 'FIXED_INCOME',
  MUTUAL_FUND = 'MUTUAL_FUND',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

export enum InvestmentSubtype {
  STRUCTURED_NOTE = 'STRUCTURED_NOTE',
  STOCK = 'STOCK',
  ETF = 'ETF',
  REAL_ESTATE_FUND = 'REAL_ESTATE_FUND',
  BDR = 'BDR',
  DERIVATIVES = 'DERIVATIVES',
  OPTION = 'OPTION',
  TREASURY = 'TREASURY',
  LCI = 'LCI',
  LCA = 'LCA',
  LF = 'LF',
  CDB = 'CDB',
  CRI = 'CRI',
  CRA = 'CRA',
  CORPORATE_DEBT = 'CORPORATE_DEBT',
  LC = 'LC',
  DEBENTURES = 'DEBENTURES',
  INVESTMENT_FUND = 'INVESTMENT_FUND',
  MULTIMARKET_FUND = 'MULTIMARKET_FUND',
  FIXED_INCOME_FUND = 'FIXED_INCOME_FUND',
  STOCK_FUND = 'STOCK_FUND',
  ETF_FUND = 'ETF_FUND',
  OFFSHORE_FUND = 'OFFSHORE_FUND',
  FIP_FUND = 'FIP_FUND',
  EXCHANGE_FUND = 'EXCHANGE_FUND',
  RETIREMENT = 'RETIREMENT',
  OTHER = 'OTHER',
}

export enum InvestmentStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  TOTAL_WITHDRAWAL = 'TOTAL_WITHDRAWAL',
}

export enum InvestmentTransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  TAX = 'TAX',
  TRANSFER = 'TRANSFER',
  INTEREST = 'INTEREST',
  AMORTIZATION = 'AMORTIZATION',
}

export enum MovementType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface InvestmentTransactionData {
  id: string
  investmentId: string
  type: InvestmentTransactionType
  movementType?: MovementType
  quantity?: number
  value?: number
  amount?: number
  netAmount?: number
  description?: string
  agreedRate?: number
  date: Date
  tradeDate?: Date
  brokerageNumber?: string
  expenses?: string
}

export interface InvestmentData {
  id: string
  itemId: string
  type: InvestmentType
  subtype?: InvestmentSubtype
  number?: string
  balance: number
  name: string
  lastMonthRate?: number
  lastTwelveMonthsRate?: number
  annualRate?: number
  currencyCode: string
  code?: string
  isin?: string
  value?: number
  quantity?: number
  amount?: number
  taxes?: number
  taxes2?: number
  date: Date
  owner?: string
  amountProfit?: number
  amountWithdrawal?: number
  amountOriginal?: number
  dueDate?: Date
  issuer?: string
  issuerCNPJ?: string
  issueDate?: Date
  rate?: number
  rateType?: string
  fixedAnnualRate?: number
  status?: InvestmentStatus
  institution?: string
  metadata?: string
  createdAt: Date
  updatedAt: Date
  investmentTransactions: InvestmentTransactionData[]
}

export class Investment {
  constructor(private data: InvestmentData) {}

  get id(): string {
    return this.data.id
  }

  get itemId(): string {
    return this.data.itemId
  }

  get type(): InvestmentType {
    return this.data.type
  }

  get subtype(): InvestmentSubtype | undefined {
    return this.data.subtype
  }

  get number(): string | undefined {
    return this.data.number
  }

  get balance(): number {
    return this.data.balance
  }

  get name(): string {
    return this.data.name
  }

  get lastMonthRate(): number | undefined {
    return this.data.lastMonthRate
  }

  get lastTwelveMonthsRate(): number | undefined {
    return this.data.lastTwelveMonthsRate
  }

  get annualRate(): number | undefined {
    return this.data.annualRate
  }

  get currencyCode(): string {
    return this.data.currencyCode
  }

  get code(): string | undefined {
    return this.data.code
  }

  get isin(): string | undefined {
    return this.data.isin
  }

  get value(): number | undefined {
    return this.data.value
  }

  get quantity(): number | undefined {
    return this.data.quantity
  }

  get amount(): number | undefined {
    return this.data.amount
  }

  get taxes(): number | undefined {
    return this.data.taxes
  }

  get taxes2(): number | undefined {
    return this.data.taxes2
  }

  get date(): Date {
    return this.data.date
  }

  get owner(): string | undefined {
    return this.data.owner
  }

  get amountProfit(): number | undefined {
    return this.data.amountProfit
  }

  get amountWithdrawal(): number | undefined {
    return this.data.amountWithdrawal
  }

  get amountOriginal(): number | undefined {
    return this.data.amountOriginal
  }

  get dueDate(): Date | undefined {
    return this.data.dueDate
  }

  get issuer(): string | undefined {
    return this.data.issuer
  }

  get issuerCNPJ(): string | undefined {
    return this.data.issuerCNPJ
  }

  get issueDate(): Date | undefined {
    return this.data.issueDate
  }

  get rate(): number | undefined {
    return this.data.rate
  }

  get rateType(): string | undefined {
    return this.data.rateType
  }

  get fixedAnnualRate(): number | undefined {
    return this.data.fixedAnnualRate
  }

  get status(): InvestmentStatus | undefined {
    return this.data.status
  }

  get institution(): string | undefined {
    return this.data.institution
  }

  get metadata(): string | undefined {
    return this.data.metadata
  }

  get createdAt(): Date {
    return this.data.createdAt
  }

  get updatedAt(): Date {
    return this.data.updatedAt
  }

  get investmentTransactions(): InvestmentTransactionData[] {
    return this.data.investmentTransactions
  }

  isActive(): boolean {
    return this.data.status === InvestmentStatus.ACTIVE
  }

  isPending(): boolean {
    return this.data.status === InvestmentStatus.PENDING
  }

  isWithdrawn(): boolean {
    return this.data.status === InvestmentStatus.TOTAL_WITHDRAWAL
  }

  isFixedIncome(): boolean {
    return this.data.type === InvestmentType.FIXED_INCOME
  }

  isEquity(): boolean {
    return this.data.type === InvestmentType.EQUITY
  }

  isETF(): boolean {
    return this.data.type === InvestmentType.ETF
  }

  isProfitable(): boolean {
    return (this.data.amountProfit ?? 0) > 0
  }

  getYield(): number {
    const original = this.data.amountOriginal ?? this.data.balance
    const profit = this.data.amountProfit ?? 0
    return original > 0 ? (profit / original) * 100 : 0
  }

  isDueToday(): boolean {
    if (!this.data.dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(this.data.dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime()
  }

  isOverdue(): boolean {
    if (!this.data.dueDate) return false
    return new Date() > this.data.dueDate
  }
}
