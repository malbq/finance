export interface PluggyAccount {
  id: string
  itemId: string
  type: 'BANK' | 'CREDIT'
  subtype?: 'CHECKING_ACCOUNT' | 'CREDIT_CARD' | 'SAVINGS_ACCOUNT'
  number?: string
  name: string
  balance: number
  currencyCode: string
  marketingName?: string
  taxNumber?: string
  owner?: string
  createdAt: string
  updatedAt: string
  bankData?: {
    transferNumber?: string
    closingBalance?: number
    automaticallyInvestedBalance?: number
    overdraftContractedLimit?: number
    overdraftUsedLimit?: number
    unarrangedOverdraftAmount?: number
  }
  creditData?: {
    level?: string
    brand?: string
    balanceCloseDate?: string
    balanceDueDate?: string
    availableCreditLimit?: number
    balanceForeignCurrency?: number
    minimumPayment?: number
    creditLimit?: number
    isLimitFlexible?: boolean
    holderType?: string
    status?: string
  }
}

export interface PluggyTransaction {
  id: string
  accountId: string
  description: string
  descriptionRaw?: string
  currencyCode: string
  amount: number
  amountInAccountCurrency?: number
  date: string
  category?: string
  categoryId?: string
  balance?: number
  providerCode?: string
  status?: 'POSTED' | 'PENDING'
  type?: 'CREDIT' | 'DEBIT'
  operationType?: string
  providerId?: string
  createdAt: string
  updatedAt: string
  paymentData?: {
    payer?: {
      name?: string
      branchNumber?: string
      accountNumber?: string
      routingNumber?: string
      routingNumberISPB?: string
      documentNumber?: {
        type?: string
        value?: string
      }
    }
    receiver?: {
      name?: string
      branchNumber?: string
      accountNumber?: string
      routingNumber?: string
      routingNumberISPB?: string
      documentNumber?: {
        type?: string
        value?: string
      }
    }
    paymentMethod?: string
    reason?: string
    receiverReferenceId?: string
    referenceNumber?: string
    boletoMetadata?: string
  }
  creditCardMetadata?: {
    installmentNumber?: number
    totalInstallments?: number
    totalAmount?: number
    payeeMCC?: string
    purchaseDate?: string
    cardNumber?: string
    billId?: string
  }
  acquirerData?: {
    data?: string
  }
  merchant?: {
    cnae?: string
    cnpj?: string
    name?: string
    category?: string
    businessName?: string
  }
}

export interface PluggyInvestment {
  id: string
  itemId: string
  type: string
  subtype?: string
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
  date: string
  owner?: string
  amountProfit?: number
  amountWithdrawal?: number
  amountOriginal?: number
  dueDate?: string
  issuer?: string
  issuerCNPJ?: string
  issueDate?: string
  rate?: number
  rateType?: string
  fixedAnnualRate?: number
  status?: 'ACTIVE' | 'PENDING' | 'TOTAL_WITHDRAWAL'
  institution?: string
  metadata?: string
  createdAt: string
  updatedAt: string
}

export interface PluggyInvestmentTransaction {
  id: string
  investmentId: string
  type: 'BUY' | 'SELL' | 'TAX' | 'TRANSFER' | 'INTEREST' | 'AMORTIZATION'
  movementType?: 'CREDIT' | 'DEBIT'
  quantity?: number
  value?: number
  amount?: number
  netAmount?: number
  description?: string
  agreedRate?: number
  date: string
  tradeDate?: string
  brokerageNumber?: string
  expenses?: string
}

export interface PluggyCategory {
  id: string
  description: string
  descriptionTranslated: string
  parentId?: string
  parentDescription?: string
}

export const PluggyDataMapper = {
  mapInvestmentType(
    type: string
  ):
    | 'COE'
    | 'EQUITY'
    | 'ETF'
    | 'FIXED_INCOME'
    | 'MUTUAL_FUND'
    | 'SECURITY'
    | 'OTHER' {
    const typeMap: Record<
      string,
      | 'COE'
      | 'EQUITY'
      | 'ETF'
      | 'FIXED_INCOME'
      | 'MUTUAL_FUND'
      | 'SECURITY'
      | 'OTHER'
    > = {
      COE: 'COE',
      EQUITY: 'EQUITY',
      ETF: 'ETF',
      FIXED_INCOME: 'FIXED_INCOME',
      MUTUAL_FUND: 'MUTUAL_FUND',
      SECURITY: 'SECURITY',
    }
    return typeMap[type] || 'OTHER'
  },

  mapInvestmentSubtype(
    subtype?: string
  ):
    | 'STRUCTURED_NOTE'
    | 'STOCK'
    | 'ETF'
    | 'REAL_ESTATE_FUND'
    | 'BDR'
    | 'DERIVATIVES'
    | 'OPTION'
    | 'TREASURY'
    | 'LCI'
    | 'LCA'
    | 'LF'
    | 'CDB'
    | 'CRI'
    | 'CRA'
    | 'CORPORATE_DEBT'
    | 'LC'
    | 'DEBENTURES'
    | 'INVESTMENT_FUND'
    | 'MULTIMARKET_FUND'
    | 'FIXED_INCOME_FUND'
    | 'STOCK_FUND'
    | 'ETF_FUND'
    | 'OFFSHORE_FUND'
    | 'FIP_FUND'
    | 'EXCHANGE_FUND'
    | 'RETIREMENT'
    | 'OTHER'
    | undefined {
    if (!subtype) return undefined

    const subtypeMap: Record<
      string,
      | 'STRUCTURED_NOTE'
      | 'STOCK'
      | 'ETF'
      | 'REAL_ESTATE_FUND'
      | 'BDR'
      | 'DERIVATIVES'
      | 'OPTION'
      | 'TREASURY'
      | 'LCI'
      | 'LCA'
      | 'LF'
      | 'CDB'
      | 'CRI'
      | 'CRA'
      | 'CORPORATE_DEBT'
      | 'LC'
      | 'DEBENTURES'
      | 'INVESTMENT_FUND'
      | 'MULTIMARKET_FUND'
      | 'FIXED_INCOME_FUND'
      | 'STOCK_FUND'
      | 'ETF_FUND'
      | 'OFFSHORE_FUND'
      | 'FIP_FUND'
      | 'EXCHANGE_FUND'
      | 'RETIREMENT'
      | 'OTHER'
    > = {
      STRUCTURED_NOTE: 'STRUCTURED_NOTE',
      STOCK: 'STOCK',
      ETF: 'ETF',
      REAL_ESTATE_FUND: 'REAL_ESTATE_FUND',
      BDR: 'BDR',
      DERIVATIVES: 'DERIVATIVES',
      OPTION: 'OPTION',
      TREASURY: 'TREASURY',
      LCI: 'LCI',
      LCA: 'LCA',
      LF: 'LF',
      CDB: 'CDB',
      CRI: 'CRI',
      CRA: 'CRA',
      CORPORATE_DEBT: 'CORPORATE_DEBT',
      LC: 'LC',
      DEBENTURES: 'DEBENTURES',
      INVESTMENT_FUND: 'INVESTMENT_FUND',
      MULTIMARKET_FUND: 'MULTIMARKET_FUND',
      FIXED_INCOME_FUND: 'FIXED_INCOME_FUND',
      STOCK_FUND: 'STOCK_FUND',
      ETF_FUND: 'ETF_FUND',
      OFFSHORE_FUND: 'OFFSHORE_FUND',
      FIP_FUND: 'FIP_FUND',
      EXCHANGE_FUND: 'EXCHANGE_FUND',
      RETIREMENT: 'RETIREMENT',
    }
    return subtypeMap[subtype] || 'OTHER'
  },

  mapInvestmentStatus(
    status?: string
  ): 'ACTIVE' | 'PENDING' | 'TOTAL_WITHDRAWAL' | undefined {
    if (!status) return undefined

    const statusMap: Record<string, 'ACTIVE' | 'PENDING' | 'TOTAL_WITHDRAWAL'> =
      {
        ACTIVE: 'ACTIVE',
        PENDING: 'PENDING',
        TOTAL_WITHDRAWAL: 'TOTAL_WITHDRAWAL',
      }
    return statusMap[status]
  },

  mapMovementType(movementType?: string): 'CREDIT' | 'DEBIT' | undefined {
    if (!movementType) return undefined

    const movementTypeMap: Record<string, 'CREDIT' | 'DEBIT'> = {
      CREDIT: 'CREDIT',
      DEBIT: 'DEBIT',
    }
    return movementTypeMap[movementType]
  },

  mapAccountToDatabase(account: PluggyAccount) {
    return {
      id: account.id,
      itemId: account.itemId,
      number: account.number || null,
      type: account.type,
      subtype: account.subtype || null,
      name: account.name,
      balance: account.balance,
      currencyCode: account.currencyCode,
      marketingName: account.marketingName || null,
      taxNumber: account.taxNumber || null,
      owner: account.owner || null,
      createdAt: new Date(account.createdAt),
      updatedAt: new Date(account.updatedAt),
    }
  },

  mapBankDataToDatabase(
    accountId: string,
    bankData: NonNullable<PluggyAccount['bankData']>
  ) {
    return {
      accountId,
      transferNumber: bankData.transferNumber || null,
      closingBalance: bankData.closingBalance || null,
      automaticallyInvestedBalance:
        bankData.automaticallyInvestedBalance || null,
      overdraftContractedLimit: bankData.overdraftContractedLimit || null,
      overdraftUsedLimit: bankData.overdraftUsedLimit || null,
      unarrangedOverdraftAmount: bankData.unarrangedOverdraftAmount || null,
    }
  },

  mapCreditDataToDatabase(
    accountId: string,
    creditData: NonNullable<PluggyAccount['creditData']>
  ) {
    return {
      accountId,
      level: creditData.level || null,
      brand: creditData.brand || null,
      balanceCloseDate: creditData.balanceCloseDate
        ? new Date(creditData.balanceCloseDate)
        : null,
      balanceDueDate: creditData.balanceDueDate
        ? new Date(creditData.balanceDueDate)
        : null,
      availableCreditLimit: creditData.availableCreditLimit || null,
      balanceForeignCurrency: creditData.balanceForeignCurrency || null,
      minimumPayment: creditData.minimumPayment || null,
      creditLimit: creditData.creditLimit || null,
      isLimitFlexible: creditData.isLimitFlexible || null,
      holderType: creditData.holderType || null,
      status: creditData.status || null,
    }
  },

  mapTransactionToDatabase(transaction: PluggyTransaction) {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      description: transaction.description,
      descriptionRaw: transaction.descriptionRaw || null,
      currencyCode: transaction.currencyCode,
      amount: transaction.amount,
      amountInAccountCurrency: transaction.amountInAccountCurrency || null,
      date: new Date(transaction.date),
      category: transaction.category || null,
      categoryId: transaction.categoryId || null,
      balance: transaction.balance || null,
      providerCode: transaction.providerCode || null,
      status: transaction.status || null,
      type: transaction.type || null,
      operationType: transaction.operationType || null,
      providerId: transaction.providerId || null,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    }
  },

  mapInvestmentToDatabase(investment: PluggyInvestment) {
    return {
      id: investment.id,
      itemId: investment.itemId,
      type: this.mapInvestmentType(investment.type),
      subtype: this.mapInvestmentSubtype(investment.subtype),
      number: investment.number || null,
      balance: investment.balance,
      name: investment.name,
      lastMonthRate: investment.lastMonthRate || null,
      lastTwelveMonthsRate: investment.lastTwelveMonthsRate || null,
      annualRate: investment.annualRate || null,
      currencyCode: investment.currencyCode,
      code: investment.code || null,
      isin: investment.isin || null,
      value: investment.value || null,
      quantity: investment.quantity || null,
      amount: investment.amount || null,
      taxes: investment.taxes || null,
      taxes2: investment.taxes2 || null,
      date: new Date(investment.date),
      owner: investment.owner || null,
      amountProfit: investment.amountProfit || null,
      amountWithdrawal: investment.amountWithdrawal || null,
      amountOriginal: investment.amountOriginal || null,
      dueDate: investment.dueDate ? new Date(investment.dueDate) : null,
      issuer: investment.issuer || null,
      issuerCNPJ: investment.issuerCNPJ || null,
      issueDate: investment.issueDate ? new Date(investment.issueDate) : null,
      rate: investment.rate || null,
      rateType: investment.rateType || null,
      fixedAnnualRate: investment.fixedAnnualRate || null,
      status: this.mapInvestmentStatus(investment.status),
      institution: investment.institution || null,
      metadata: investment.metadata || null,
      createdAt: new Date(investment.createdAt),
      updatedAt: new Date(investment.updatedAt),
    }
  },

  mapInvestmentTransactionToDatabase(transaction: PluggyInvestmentTransaction) {
    return {
      id: transaction.id,
      investmentId: transaction.investmentId,
      type: transaction.type,
      movementType: this.mapMovementType(transaction.movementType),
      quantity: transaction.quantity || null,
      value: transaction.value || null,
      amount: transaction.amount || null,
      netAmount: transaction.netAmount || null,
      description: transaction.description || null,
      agreedRate: transaction.agreedRate || null,
      date: new Date(transaction.date),
      tradeDate: transaction.tradeDate ? new Date(transaction.tradeDate) : null,
      brokerageNumber: transaction.brokerageNumber || null,
      expenses: transaction.expenses || null,
    }
  },

  mapCategoryToDatabase(category: PluggyCategory) {
    return {
      id: category.id,
      description: category.description,
      descriptionTranslated: category.descriptionTranslated,
      parentId: category.parentId || null,
      parentDescription: category.parentDescription || null,
    }
  },
}
