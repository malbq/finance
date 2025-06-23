import { PrismaClient } from '@prisma-app/client'

const prisma = new PrismaClient()

interface PluggyAuthResponse {
  apiKey: string
}

interface PluggyAccount {
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
    additionalCards?: string
  }
}

interface PluggyTransaction {
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

interface PluggyInvestment {
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
}

interface PluggyInvestmentTransaction {
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

interface PluggyCategory {
  id: string
  description: string
  descriptionTranslated: string
  parentId?: string
  parentDescription?: string
}

function mapInvestmentType(
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
}

function mapInvestmentSubtype(
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
}

function mapInvestmentStatus(
  status?: string
): 'ACTIVE' | 'PENDING' | 'TOTAL_WITHDRAWAL' | undefined {
  if (!status) return undefined

  const statusMap: Record<string, 'ACTIVE' | 'PENDING' | 'TOTAL_WITHDRAWAL'> = {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    TOTAL_WITHDRAWAL: 'TOTAL_WITHDRAWAL',
  }
  return statusMap[status]
}

function mapMovementType(
  movementType?: string
): 'CREDIT' | 'DEBIT' | undefined {
  if (!movementType) return undefined

  const movementTypeMap: Record<string, 'CREDIT' | 'DEBIT'> = {
    CREDIT: 'CREDIT',
    DEBIT: 'DEBIT',
  }
  return movementTypeMap[movementType]
}

async function authenticateWithPluggy(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Pluggy credentials not configured')
  }

  const response = await fetch('https://api.pluggy.ai/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(
      `Authentication failed: ${errorData.message || response.statusText}`
    )
  }

  const data: PluggyAuthResponse = await response.json()
  return data.apiKey
}

async function fetchPluggyData(
  apiKey: string,
  endpoint: string,
  params?: Record<string, string>
) {
  const url = new URL(`https://api.pluggy.ai${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`)
  }

  return response.json()
}

async function syncAccounts(apiKey: string) {
  const itemIdsEnv = process.env.PLUGGY_ITEM_ID

  if (!itemIdsEnv) {
    throw new Error('PLUGGY_ITEM_ID not configured')
  }

  const itemIds = itemIdsEnv.includes(',')
    ? itemIdsEnv.split(',').map((id) => id.trim())
    : [itemIdsEnv.trim()]
  const allAccounts: PluggyAccount[] = []

  for (const itemId of itemIds) {
    console.log('Syncing accounts for itemId:', itemId)
    const { results: accounts } = await fetchPluggyData(apiKey, '/accounts', {
      itemId,
    })
    allAccounts.push(...(accounts as PluggyAccount[]))
  }

  for (const account of allAccounts) {
    console.log('Syncing account:', account.name)
    if (account.subtype === 'SAVINGS_ACCOUNT') {
      continue
    }
    await prisma.account.upsert({
      where: {
        itemId_number: {
          itemId: account.itemId,
          number: account.number || account.id,
        },
      },
      update: {
        name: account.name,
        balance: account.balance,
        currencyCode: account.currencyCode,
        marketingName: account.marketingName,
        taxNumber: account.taxNumber,
        owner: account.owner,
        updatedAt: new Date(),
      },
      create: {
        id: account.id,
        itemId: account.itemId,
        number: account.number || account.id,
        type: account.type,
        subtype: account.subtype,
        name: account.name,
        balance: account.balance,
        currencyCode: account.currencyCode,
        marketingName: account.marketingName,
        taxNumber: account.taxNumber,
        owner: account.owner,
      },
    })

    if (account.bankData) {
      await prisma.bankData.upsert({
        where: { accountId: account.id },
        update: {
          transferNumber: account.bankData.transferNumber,
          closingBalance: account.bankData.closingBalance,
          automaticallyInvestedBalance:
            account.bankData.automaticallyInvestedBalance,
          overdraftContractedLimit: account.bankData.overdraftContractedLimit,
          overdraftUsedLimit: account.bankData.overdraftUsedLimit,
          unarrangedOverdraftAmount: account.bankData.unarrangedOverdraftAmount,
        },
        create: {
          accountId: account.id,
          transferNumber: account.bankData.transferNumber,
          closingBalance: account.bankData.closingBalance,
          automaticallyInvestedBalance:
            account.bankData.automaticallyInvestedBalance,
          overdraftContractedLimit: account.bankData.overdraftContractedLimit,
          overdraftUsedLimit: account.bankData.overdraftUsedLimit,
          unarrangedOverdraftAmount: account.bankData.unarrangedOverdraftAmount,
        },
      })
    }

    if (account.creditData) {
      await prisma.creditData.upsert({
        where: { accountId: account.id },
        update: {
          level: account.creditData.level,
          brand: account.creditData.brand,
          balanceCloseDate: account.creditData.balanceCloseDate
            ? new Date(account.creditData.balanceCloseDate)
            : null,
          balanceDueDate: account.creditData.balanceDueDate
            ? new Date(account.creditData.balanceDueDate)
            : null,
          availableCreditLimit: account.creditData.availableCreditLimit,
          balanceForeignCurrency: account.creditData.balanceForeignCurrency,
          minimumPayment: account.creditData.minimumPayment,
          creditLimit: account.creditData.creditLimit,
          isLimitFlexible: account.creditData.isLimitFlexible,
          holderType: account.creditData.holderType,
          status: account.creditData.status,
          additionalCards: account.creditData.additionalCards,
        },
        create: {
          accountId: account.id,
          level: account.creditData.level,
          brand: account.creditData.brand,
          balanceCloseDate: account.creditData.balanceCloseDate
            ? new Date(account.creditData.balanceCloseDate)
            : null,
          balanceDueDate: account.creditData.balanceDueDate
            ? new Date(account.creditData.balanceDueDate)
            : null,
          availableCreditLimit: account.creditData.availableCreditLimit,
          balanceForeignCurrency: account.creditData.balanceForeignCurrency,
          minimumPayment: account.creditData.minimumPayment,
          creditLimit: account.creditData.creditLimit,
          isLimitFlexible: account.creditData.isLimitFlexible,
          holderType: account.creditData.holderType,
          status: account.creditData.status,
          additionalCards: account.creditData.additionalCards,
        },
      })
    }
  }

  return allAccounts
}

async function syncTransactions(apiKey: string, accounts: PluggyAccount[]) {
  for (const account of accounts) {
    const params: Record<string, string> = {
      accountId: account.id,
      pageSize: '500',
    }

    const latestTransaction = await prisma.transaction.findFirst({
      where: { accountId: account.id },
      orderBy: { date: 'desc' },
    })
    if (latestTransaction) {
      params.from = latestTransaction.date.toISOString().split('T')[0]
    }
    params.from = '2025-06-14'

    const { results: transactions } = await fetchPluggyData(
      apiKey,
      '/transactions',
      params
    )

    for (const transaction of transactions as PluggyTransaction[]) {
      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: {
          description: transaction.description,
          descriptionRaw: transaction.descriptionRaw,
          currencyCode: transaction.currencyCode,
          amount: transaction.amount,
          amountInAccountCurrency: transaction.amountInAccountCurrency,
          date: new Date(transaction.date),
          category: transaction.category,
          categoryId: transaction.categoryId,
          balance: transaction.balance,
          providerCode: transaction.providerCode,
          status: transaction.status,
          type: transaction.type,
          operationType: transaction.operationType,
          providerId: transaction.providerId,
          updatedAt: new Date(),
        },
        create: {
          id: transaction.id,
          accountId: transaction.accountId,
          description: transaction.description,
          descriptionRaw: transaction.descriptionRaw,
          currencyCode: transaction.currencyCode,
          amount: transaction.amount,
          amountInAccountCurrency: transaction.amountInAccountCurrency,
          date: new Date(transaction.date),
          category: transaction.category,
          categoryId: transaction.categoryId,
          balance: transaction.balance,
          providerCode: transaction.providerCode,
          status: transaction.status,
          type: transaction.type,
          operationType: transaction.operationType,
          providerId: transaction.providerId,
        },
      })

      // Handle credit card metadata separately
      if (transaction.creditCardMetadata) {
        await prisma.creditCardMetadata.upsert({
          where: { transactionId: transaction.id },
          update: {
            data: JSON.stringify(transaction.creditCardMetadata),
          },
          create: {
            transactionId: transaction.id,
            data: JSON.stringify(transaction.creditCardMetadata),
          },
        })
      }

      // Handle payment data separately
      if (transaction.paymentData) {
        const paymentData = await prisma.paymentData.upsert({
          where: { transactionId: transaction.id },
          update: {
            paymentMethod: transaction.paymentData.paymentMethod,
            reason: transaction.paymentData.reason,
            receiverReferenceId: transaction.paymentData.receiverReferenceId,
            referenceNumber: transaction.paymentData.referenceNumber,
            boletoMetadata: transaction.paymentData.boletoMetadata,
          },
          create: {
            transactionId: transaction.id,
            paymentMethod: transaction.paymentData.paymentMethod,
            reason: transaction.paymentData.reason,
            receiverReferenceId: transaction.paymentData.receiverReferenceId,
            referenceNumber: transaction.paymentData.referenceNumber,
            boletoMetadata: transaction.paymentData.boletoMetadata,
          },
        })

        // Handle payer and receiver participants
        if (transaction.paymentData.payer) {
          await prisma.paymentParticipant.upsert({
            where: { payerPaymentDataId: paymentData.id },
            update: {
              accountNumber: transaction.paymentData.payer.accountNumber,
              branchNumber: transaction.paymentData.payer.branchNumber,
              documentType: transaction.paymentData.payer.documentNumber?.type,
              documentValue:
                transaction.paymentData.payer.documentNumber?.value,
              name: transaction.paymentData.payer.name,
              routingNumber: transaction.paymentData.payer.routingNumber,
              routingNumberISPB:
                transaction.paymentData.payer.routingNumberISPB,
            },
            create: {
              accountNumber: transaction.paymentData.payer.accountNumber,
              branchNumber: transaction.paymentData.payer.branchNumber,
              documentType: transaction.paymentData.payer.documentNumber?.type,
              documentValue:
                transaction.paymentData.payer.documentNumber?.value,
              name: transaction.paymentData.payer.name,
              routingNumber: transaction.paymentData.payer.routingNumber,
              routingNumberISPB:
                transaction.paymentData.payer.routingNumberISPB,
              payerPaymentDataId: paymentData.id,
            },
          })
        }

        if (transaction.paymentData.receiver) {
          await prisma.paymentParticipant.upsert({
            where: { receiverPaymentDataId: paymentData.id },
            update: {
              accountNumber: transaction.paymentData.receiver.accountNumber,
              branchNumber: transaction.paymentData.receiver.branchNumber,
              documentType:
                transaction.paymentData.receiver.documentNumber?.type,
              documentValue:
                transaction.paymentData.receiver.documentNumber?.value,
              name: transaction.paymentData.receiver.name,
              routingNumber: transaction.paymentData.receiver.routingNumber,
              routingNumberISPB:
                transaction.paymentData.receiver.routingNumberISPB,
            },
            create: {
              accountNumber: transaction.paymentData.receiver.accountNumber,
              branchNumber: transaction.paymentData.receiver.branchNumber,
              documentType:
                transaction.paymentData.receiver.documentNumber?.type,
              documentValue:
                transaction.paymentData.receiver.documentNumber?.value,
              name: transaction.paymentData.receiver.name,
              routingNumber: transaction.paymentData.receiver.routingNumber,
              routingNumberISPB:
                transaction.paymentData.receiver.routingNumberISPB,
              receiverPaymentDataId: paymentData.id,
            },
          })
        }
      }

      // Handle acquirer data separately
      if (transaction.acquirerData) {
        await prisma.acquirerData.upsert({
          where: { transactionId: transaction.id },
          update: {
            data: transaction.acquirerData.data,
          },
          create: {
            transactionId: transaction.id,
            data: transaction.acquirerData.data,
          },
        })
      }

      // Handle merchant data separately
      if (transaction.merchant) {
        await prisma.merchant.upsert({
          where: { transactionId: transaction.id },
          update: {
            cnae: transaction.merchant.cnae,
            cnpj: transaction.merchant.cnpj,
            name: transaction.merchant.name,
            category: transaction.merchant.category,
            businessName: transaction.merchant.businessName,
          },
          create: {
            transactionId: transaction.id,
            cnae: transaction.merchant.cnae,
            cnpj: transaction.merchant.cnpj,
            name: transaction.merchant.name,
            category: transaction.merchant.category,
            businessName: transaction.merchant.businessName,
          },
        })
      }
    }
  }
}

async function syncInvestments(apiKey: string) {
  const itemIdsEnv = process.env.PLUGGY_ITEM_ID

  if (!itemIdsEnv) {
    throw new Error('PLUGGY_ITEM_ID not configured')
  }

  const itemIds = itemIdsEnv.includes(',')
    ? itemIdsEnv.split(',').map((id) => id.trim())
    : [itemIdsEnv.trim()]

  const allInvestments: PluggyInvestment[] = []

  for (const itemId of itemIds) {
    const { results: investments } = await fetchPluggyData(
      apiKey,
      '/investments',
      { itemId }
    )
    allInvestments.push(...(investments as PluggyInvestment[]))
  }

  for (const investment of allInvestments) {
    try {
      await prisma.investment.upsert({
        where: {
          itemId_id: {
            itemId: investment.itemId,
            id: investment.id,
          },
        },
        update: {
          type: mapInvestmentType(investment.type),
          subtype: mapInvestmentSubtype(investment.subtype),
          number: investment.number,
          balance: investment.balance,
          name: investment.name,
          lastMonthRate: investment.lastMonthRate,
          lastTwelveMonthsRate: investment.lastTwelveMonthsRate,
          annualRate: investment.annualRate,
          currencyCode: investment.currencyCode,
          code: investment.code,
          isin: investment.isin,
          value: investment.value,
          quantity: investment.quantity,
          amount: investment.amount,
          taxes: investment.taxes,
          taxes2: investment.taxes2,
          date: new Date(investment.date),
          owner: investment.owner,
          amountProfit: investment.amountProfit,
          amountWithdrawal: investment.amountWithdrawal,
          amountOriginal: investment.amountOriginal,
          dueDate: investment.dueDate ? new Date(investment.dueDate) : null,
          issuer: investment.issuer,
          issuerCNPJ: investment.issuerCNPJ,
          issueDate: investment.issueDate
            ? new Date(investment.issueDate)
            : null,
          rate: investment.rate,
          rateType: investment.rateType,
          fixedAnnualRate: investment.fixedAnnualRate,
          status: mapInvestmentStatus(investment.status),
          institution: investment.institution,
          metadata: investment.metadata,
          updatedAt: new Date(),
        },
        create: {
          id: investment.id,
          itemId: investment.itemId,
          type: mapInvestmentType(investment.type),
          subtype: mapInvestmentSubtype(investment.subtype),
          number: investment.number,
          balance: investment.balance,
          name: investment.name,
          lastMonthRate: investment.lastMonthRate,
          lastTwelveMonthsRate: investment.lastTwelveMonthsRate,
          annualRate: investment.annualRate,
          currencyCode: investment.currencyCode,
          code: investment.code,
          isin: investment.isin,
          value: investment.value,
          quantity: investment.quantity,
          amount: investment.amount,
          taxes: investment.taxes,
          taxes2: investment.taxes2,
          date: new Date(investment.date),
          owner: investment.owner,
          amountProfit: investment.amountProfit,
          amountWithdrawal: investment.amountWithdrawal,
          amountOriginal: investment.amountOriginal,
          dueDate: investment.dueDate ? new Date(investment.dueDate) : null,
          issuer: investment.issuer,
          issuerCNPJ: investment.issuerCNPJ,
          issueDate: investment.issueDate
            ? new Date(investment.issueDate)
            : null,
          rate: investment.rate,
          rateType: investment.rateType,
          fixedAnnualRate: investment.fixedAnnualRate,
          status: mapInvestmentStatus(investment.status),
          institution: investment.institution,
          metadata: investment.metadata,
        },
      })
    } catch (error) {
      console.error(`Failed to sync investment ${investment.id}:`, error)
      console.error('Investment data:', investment)
      throw error
    }
  }

  return allInvestments
}

async function syncInvestmentTransactions(
  apiKey: string,
  investments: PluggyInvestment[]
) {
  for (const investment of investments) {
    const latestTransaction = await prisma.investmentTransaction.findFirst({
      where: { investmentId: investment.id },
      orderBy: { date: 'desc' },
    })

    const params: Record<string, string> = {
      pageSize: '500',
    }

    if (latestTransaction) {
      params.from = latestTransaction.date.toISOString().split('T')[0]
    }

    const { results: investmentTransactions } = await fetchPluggyData(
      apiKey,
      `/investments/${investment.id}/transactions`,
      params
    )

    for (const transaction of investmentTransactions as PluggyInvestmentTransaction[]) {
      try {
        await prisma.investmentTransaction.upsert({
          where: { id: transaction.id },
          update: {
            type: transaction.type,
            movementType: mapMovementType(transaction.movementType),
            quantity: transaction.quantity,
            value: transaction.value,
            amount: transaction.amount,
            netAmount: transaction.netAmount,
            description: transaction.description,
            agreedRate: transaction.agreedRate,
            date: new Date(transaction.date),
            tradeDate: transaction.tradeDate
              ? new Date(transaction.tradeDate)
              : null,
            brokerageNumber: transaction.brokerageNumber,
            expenses: transaction.expenses,
            updatedAt: new Date(),
          },
          create: {
            id: transaction.id,
            investmentId: investment.id,
            type: transaction.type,
            movementType: mapMovementType(transaction.movementType),
            quantity: transaction.quantity,
            value: transaction.value,
            amount: transaction.amount,
            netAmount: transaction.netAmount,
            description: transaction.description,
            agreedRate: transaction.agreedRate,
            date: new Date(transaction.date),
            tradeDate: transaction.tradeDate
              ? new Date(transaction.tradeDate)
              : null,
            brokerageNumber: transaction.brokerageNumber,
            expenses: transaction.expenses,
          },
        })
      } catch (error) {
        console.error(
          `Failed to sync investment transaction ${transaction.id}:`,
          error
        )
        console.error('Transaction data:', transaction)
        throw error
      }
    }
  }
}

async function syncCategories(apiKey: string) {
  const { results: categories } = await fetchPluggyData(apiKey, '/categories')

  for (const category of categories as PluggyCategory[]) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        description: category.description,
        descriptionTranslated: category.descriptionTranslated,
        parentId: category.parentId,
        parentDescription: category.parentDescription,
        updatedAt: new Date(),
      },
      create: {
        id: category.id,
        description: category.description,
        descriptionTranslated: category.descriptionTranslated,
        parentId: category.parentId,
        parentDescription: category.parentDescription,
      },
    })
  }
}

export async function action({ request }: { request: Request }) {
  if (request.method === 'POST') {
    try {
      console.log('Starting data synchronization...')

      const apiKey = await authenticateWithPluggy()
      console.log('Authentication successful')

      const accounts = await syncAccounts(apiKey)
      console.log(`Synced ${accounts.length} accounts`)

      const investments = await syncInvestments(apiKey)
      console.log(`Synced ${investments.length} investments`)

      await Promise.all([
        syncTransactions(apiKey, accounts).then(() =>
          console.log('Transactions synced')
        ),
        syncInvestmentTransactions(apiKey, investments).then(() =>
          console.log('Investment transactions synced')
        ),
        syncCategories(apiKey).then(() => console.log('Categories synced')),
      ])

      console.log('Data synchronized successfully!')
      return Response.json({
        success: true,
        message: 'Data synchronized successfully!',
      })
    } catch (error) {
      console.error('Sync error:', error)
      if (error instanceof Error) {
        console.error('Error stack:', error.stack)
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Sync failed'
      return Response.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      )
    }
  }

  return Response.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
