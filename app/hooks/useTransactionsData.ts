import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Account } from '../../domain/Account'
import type { Transaction } from '../../domain/Transaction'
import { activeAccountStore } from '../lib/activeAccountStore'
import { localStore } from '../lib/localStore'
import { useBootstrapQuery } from './useBootstrapQuery'

type AccountWithTransactions = Account & {
  transactions: Transaction[]
}

export interface TransactionsData {
  accounts: Array<AccountWithTransactions>
}

/**
 * Hook to read transactions data from local store.
 * Returns the same shape as the original useTransactionsData for backwards compatibility.
 */
export function useTransactionsData() {
  // Ensure bootstrap data is loaded
  const bootstrapQuery = useBootstrapQuery()

  // Subscribe to local store changes
  const storeState = useSyncExternalStore(
    (callback) => localStore.subscribe(callback),
    () => localStore.getSnapshot()
  )

  // Subscribe to active account store
  const activeTab = useSyncExternalStore(
    (callback) => activeAccountStore.subscribe(callback),
    () => activeAccountStore.getSnapshot()
  )

  // Derive accounts with transactions from local store
  const accounts = localStore.getAccounts()
  const allTransactions = localStore.getTransactions()

  // Group transactions by account ID
  const transactionsByAccount = new Map<string, Transaction[]>()
  for (const tx of allTransactions) {
    const existing = transactionsByAccount.get(tx.accountId) || []
    existing.push(tx)
    transactionsByAccount.set(tx.accountId, existing)
  }

  // Sort transactions within each account by date descending
  for (const [, txs] of transactionsByAccount) {
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Build accounts with transactions array
  const accountsWithTransactions: AccountWithTransactions[] = accounts.map((account) => ({
    ...account,
    transactions: transactionsByAccount.get(account.id) || [],
  }))

  const data: TransactionsData | undefined = localStore.isHydrated()
    ? { accounts: accountsWithTransactions }
    : undefined

  // Compute effective active tab: use stored value if valid, otherwise default to first account
  const effectiveActiveTab = useMemo(() => {
    if (activeTab && accounts.some((acc) => acc.id === activeTab)) {
      return activeTab
    }
    return accounts[0]?.id || ''
  }, [accounts, activeTab])

  // Set active account in store if it changed (e.g., when accounts load for the first time)
  // This keeps store in sync with effective value
  useEffect(() => {
    if (effectiveActiveTab && effectiveActiveTab !== activeTab) {
      activeAccountStore.setActiveAccount(effectiveActiveTab)
    }
  }, [activeTab, effectiveActiveTab])

  return {
    data,
    isLoading: bootstrapQuery.isLoading,
    isError: bootstrapQuery.isError,
    error: bootstrapQuery.error,
    isPending: bootstrapQuery.isPending,
    refetch: bootstrapQuery.refetch,
    activeAccountId: effectiveActiveTab,
    setActiveAccount: activeAccountStore.setActiveAccount.bind(activeAccountStore),
  }
}
