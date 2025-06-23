import { PrismaClient } from '@prisma-app/client'
import { useMemo, useState } from 'react'
import { useLoaderData, type ActionFunctionArgs } from 'react-router'
import { formatCurrency } from '~/utils/formatCurrency'
import { AccountCard } from '../components/AccountCard'
import { AccountTransactionsTable } from '../components/AccountTransactionsTable'
import { CreditCardTransactionsTable } from '../components/CreditCardTransactionsTable'
import { EmptyState } from '../components/EmptyState'

const prisma = new PrismaClient()

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
    )
  }

  try {
    const formData = await request.formData()
    const transactionId = formData.get('transactionId') as string
    const categoryId = formData.get('categoryId') as string

    if (!transactionId || !categoryId) {
      return Response.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Find the category to get the translated name
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return Response.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        categoryId: categoryId,
        category: category.descriptionTranslated,
        updatedAt: new Date(),
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error updating transaction category:', error)
    return Response.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function loader({ request }: { request: Request }) {
  try {
    // Load accounts with minimal data first
    const accounts = await prisma.account.findMany({
      include: {
        bankData: {
          select: {
            closingBalance: true,
          },
        },
        creditData: {
          select: {
            availableCreditLimit: true,
            creditLimit: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        type: 'asc',
      },
    })

    // Load categories once
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        descriptionTranslated: true,
      },
    })

    // Load all transactions for each account
    const accountsWithTransactions = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id,
          },
          include: {
            paymentData: {
              select: {
                paymentMethod: true,
                payer: {
                  select: {
                    name: true,
                    documentValue: true,
                  },
                },
                receiver: {
                  select: {
                    name: true,
                    documentValue: true,
                  },
                },
              },
            },
            creditCardMetadata: {
              select: {
                data: true,
              },
            },
            merchant: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          ...account,
          transactions,
        }
      })
    )

    // Minimal processing on server - move expensive operations to client
    const categoryMap = new Map(
      categories.map((cat) => [cat.id, cat.descriptionTranslated])
    )

    function getBalanceValue(balance: unknown): number {
      if (balance === null || balance === undefined) return 0
      const value =
        typeof balance === 'object' && balance !== null && 'toNumber' in balance
          ? (balance as { toNumber(): number }).toNumber()
          : parseFloat(String(balance))
      return isNaN(value) ? 0 : value
    }

    // Simplified serialization - only essential server-side processing
    const serializedAccounts = accountsWithTransactions.map((account) => ({
      ...account,
      balance: getBalanceValue(account.balance),
      transactions: account.transactions.map((transaction) => {
        // Parse credit card metadata only when needed
        let creditCardMeta = null
        if (transaction.creditCardMetadata?.data) {
          try {
            creditCardMeta = JSON.parse(transaction.creditCardMetadata.data)
          } catch {
            // Ignore parsing errors
          }
        }

        return {
          ...transaction,
          amount: getBalanceValue(transaction.amount),
          amountInAccountCurrency: transaction.amountInAccountCurrency
            ? getBalanceValue(transaction.amountInAccountCurrency)
            : null,
          balance: transaction.balance
            ? getBalanceValue(transaction.balance)
            : null,
          // Keep original date for client-side formatting
          futurePayment: transaction.date > new Date(),
          category:
            transaction.categoryId && categoryMap.has(transaction.categoryId)
              ? categoryMap.get(transaction.categoryId)!
              : transaction.category,
          categoryId: transaction.categoryId,
          paymentData: transaction.paymentData,
          merchant: transaction.merchant,
          // Extract credit card data without heavy processing
          installmentNumber: creditCardMeta?.installmentNumber,
          totalInstallments: creditCardMeta?.totalInstallments,
          totalAmount: creditCardMeta?.totalAmount,
          originalPurchaseDate: creditCardMeta?.purchaseDate,
          payeeMCC: creditCardMeta?.payeeMCC,
          cardNumber: creditCardMeta?.cardNumber,
        }
      }),
      bankData: account.bankData
        ? {
            closingBalance: account.bankData.closingBalance
              ? getBalanceValue(account.bankData.closingBalance)
              : null,
          }
        : null,
      creditData: account.creditData
        ? {
            availableCreditLimit: account.creditData.availableCreditLimit
              ? getBalanceValue(account.creditData.availableCreditLimit)
              : null,
            creditLimit: account.creditData.creditLimit
              ? getBalanceValue(account.creditData.creditLimit)
              : null,
          }
        : null,
    }))

    const availableCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.descriptionTranslated,
    }))

    return {
      accounts: serializedAccounts,
      categories: availableCategories,
    }
  } catch (error) {
    console.error('Error loading transactions:', error)
    return {
      accounts: [],
      categories: [],
    }
  }
}

export default function Transactions() {
  const { accounts = [], categories = [] } = useLoaderData<typeof loader>()
  const [activeTab, setActiveTab] = useState<string>(accounts[0]?.id || '')

  // Format account data on client side for display
  const formattedAccounts = useMemo(() => {
    return accounts.map((account: any) => ({
      ...account,
      balanceFormatted: formatCurrency(account.balance),
      bankData: account.bankData
        ? {
            ...account.bankData,
            closingBalanceFormatted: account.bankData.closingBalance
              ? formatCurrency(account.bankData.closingBalance)
              : null,
          }
        : null,
      creditData: account.creditData
        ? {
            ...account.creditData,
            availableCreditLimitFormatted: account.creditData
              .availableCreditLimit
              ? formatCurrency(account.creditData.availableCreditLimit)
              : null,
            creditLimitFormatted: account.creditData.creditLimit
              ? formatCurrency(account.creditData.creditLimit)
              : null,
          }
        : null,
    }))
  }, [accounts])

  const activeAccount = formattedAccounts.find(
    (account) => account.id === activeTab
  )

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No accounts found"
          description="Sync your data to view transactions from your accounts"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid gap-4 grid-cols-3">
          {formattedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isActive={activeTab === account.id}
              onClick={() => setActiveTab(account.id)}
            />
          ))}
        </div>
      </div>
      <div className="bg-zinc-800 rounded-lg">
        {activeAccount && (
          <div>
            {activeAccount.transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-zinc-400 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-300 mb-2">
                  No transactions found
                </h3>
                <p className="text-zinc-400">
                  No transactions available for this account
                </p>
              </div>
            ) : activeAccount.type === 'CREDIT' ? (
              <CreditCardTransactionsTable
                transactions={activeAccount.transactions}
                categories={categories}
              />
            ) : (
              <AccountTransactionsTable
                transactions={activeAccount.transactions}
                categories={categories}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
