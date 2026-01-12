import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import type { Account } from '../../domain/Account'
import type { Transaction } from '../../domain/Transaction'
import { formatCurrency } from '../../utils/formatCurrency'
import { AccountCard } from '../components/AccountCard'
import { EmptyState } from '../components/EmptyState'
import { TransactionTable } from '../components/transactions/TransactionTable'
import { useTransactionsData } from '../hooks/useTransactionsData'

type AccountWithTransactions = Account & {
  transactions: Transaction[]
}

export const Route = createFileRoute('/transactions')({
  component: Transactions,
})

function Transactions() {
  const { data, isLoading, error, activeAccountId, setActiveAccount } = useTransactionsData()
  const accounts = data?.accounts || []

  const formattedAccounts = useMemo(() => {
    return accounts.map((account: AccountWithTransactions) => ({
      ...account,
      balanceFormatted: formatCurrency(account.balance),
      creditData: account.creditData
        ? {
            ...account.creditData,
            availableCreditLimitFormatted: formatCurrency(account.creditData.availableCreditLimit),
            creditLimitFormatted: formatCurrency(account.creditData.creditLimit),
          }
        : undefined,
    }))
  }, [accounts])

  const activeAccount = useMemo(() => {
    if (formattedAccounts.length === 0) return undefined
    return formattedAccounts.find(
      (account: AccountWithTransactions) => account.id === activeAccountId
    )
  }, [formattedAccounts, activeAccountId])

  if (isLoading) {
    return <div className='text-zinc-300'>Loading...</div>
  }

  if (error) {
    return <div className='text-red-400'>Error loading transactions</div>
  }

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
        {formattedAccounts.map((account: AccountWithTransactions) => (
          <AccountCard
            key={account.id}
            account={account}
            isActive={activeAccountId === account.id}
            onClick={() => setActiveAccount(account.id)}
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
