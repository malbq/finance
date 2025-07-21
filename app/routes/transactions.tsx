import { useMemo, useState } from 'react'
import { useLoaderData, type ActionFunctionArgs } from 'react-router'
import { prisma } from '~/lib/db.server'
import { GetTransactionsData } from '~/use-cases/transactions/GetTransactionsData'
import { UpdateTransactionCategory } from '~/use-cases/transactions/UpdateTransactionCategory'
import { formatCurrency } from '~/utils/formatCurrency'
import { AccountCard } from '../components/AccountCard'
import { EmptyState } from '../components/EmptyState'
import { TransactionTable } from '../components/transactions/TransactionTable'

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

    const updateTransactionCategory = new UpdateTransactionCategory(prisma)
    const result = await updateTransactionCategory.execute(
      transactionId,
      categoryId
    )

    if (result.success) {
      return Response.json({ success: true })
    } else {
      return Response.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating transaction category:', error)
    return Response.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

const getTransactionsData = new GetTransactionsData(prisma)

export async function loader() {
  try {
    return await getTransactionsData.execute()
  } catch (error) {
    console.error('Error loading transactions:', error)
    return {
      accounts: [],
    }
  }
}

export default function Transactions() {
  const { accounts = [] } = useLoaderData<typeof loader>()
  const [activeTab, setActiveTab] = useState<string>(accounts[0]?.id || '')

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
      <div className='space-y-6'>
        <EmptyState
          title='No accounts found'
          description='Sync your data to view transactions from your accounts'
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 pb-48'>
      <div className='grid gap-4 grid-cols-6'>
        {formattedAccounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            isActive={activeTab === account.id}
            onClick={() => setActiveTab(account.id)}
          />
        ))}
      </div>
      {activeAccount && (
        <div className='bg-zinc-800 rounded-lg'>
          {activeAccount.transactions.length === 0 ? (
            <div className='text-center py-8 text-zinc-400'>
              No transactions found for this account
            </div>
          ) : (
            <TransactionTable
              transactions={activeAccount.transactions}
              accountType={activeAccount.type}
            />
          )}
        </div>
      )}
    </div>
  )
}
