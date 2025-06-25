import { useCallback, useMemo, useState } from 'react'
import type { AccountType } from '~/domain/accounts/entities/Account'
import type { Transaction } from '~/domain/transactions/entities/Transaction'

export interface TransactionFilters {
  date: string
  description: string
  details?: string
  category: string
}

export const useTransactionFilters = (
  transactions: Transaction[],
  accountType: AccountType = 'BANK'
) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    date: '',
    description: '',
    details: accountType === 'BANK' ? '' : undefined,
    category: '',
  })

  const updateFilter = useCallback(
    (column: keyof TransactionFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [column]: value }))
    },
    []
  )

  const filteredTransactions = useMemo(() => {
    if (
      !filters.date &&
      !filters.description &&
      !filters.details &&
      !filters.category
    ) {
      return transactions
    }

    const dateFilter = filters.date.toLowerCase()
    const descriptionFilter = filters.description.toLowerCase()
    const detailsFilter = filters.details?.toLowerCase() || ''
    const categoryFilter = filters.category.toLowerCase()

    return transactions.filter((transaction) => {
      const dateMatch =
        !dateFilter ||
        transaction.dateFormatted.toLowerCase().includes(dateFilter)

      const descriptionMatch =
        !descriptionFilter ||
        transaction.description.toLowerCase().includes(descriptionFilter)

      let detailsMatch = true
      if (detailsFilter) {
        const detailsText = [
          transaction.paymentData?.payer?.name || '',
          transaction.paymentData?.payer?.documentValue || '',
          transaction.paymentData?.receiver?.name || '',
          transaction.paymentData?.receiver?.documentValue || '',
          transaction.merchant?.name || '',
          transaction.merchant?.businessName || '',
          transaction.merchant?.category || '',
        ].join(' ')
        detailsMatch = detailsText.toLowerCase().includes(detailsFilter)
      }

      const categoryMatch =
        !categoryFilter ||
        (transaction.category || '').toLowerCase().includes(categoryFilter)

      return dateMatch && descriptionMatch && detailsMatch && categoryMatch
    })
  }, [
    transactions,
    filters.date,
    filters.description,
    filters.details,
    filters.category,
    accountType,
  ])

  return {
    filters,
    updateFilter,
    filteredTransactions,
  }
}
