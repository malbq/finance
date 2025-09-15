import { useCallback, useMemo } from 'react'
import { useFetcher } from 'react-router'
import { CATEGORY_MAP, type CategoryId } from '~/domain/transactions/entities/Categories'
import type { Transaction } from '~/domain/transactions/entities/Transaction'

export const useCategoryUpdate = () => {
  const fetcher = useFetcher()

  const updatingTransactionData = useMemo(() => {
    if (fetcher.state === 'idle' || !fetcher.formData) {
      return null
    }
    return {
      transactionId: fetcher.formData.get('transactionId') as string,
      categoryId: fetcher.formData.get('categoryId') as CategoryId,
    }
  }, [fetcher.state, fetcher.formData])

  const updateTransactionCategory = useCallback(
    (transactionId: string, categoryId: string) => {
      fetcher.submit({ transactionId, categoryId }, { method: 'post' })
    },
    [fetcher]
  )

  const getOptimisticCategory = useCallback(
    (transaction: Transaction) => {
      if (updatingTransactionData && updatingTransactionData.transactionId === transaction.id) {
        return {
          categoryId: updatingTransactionData.categoryId,
          categoryName: updatingTransactionData.categoryId
            ? CATEGORY_MAP[updatingTransactionData.categoryId]
            : '-',
        }
      }

      return {
        categoryId: transaction.categoryId,
        categoryName: transaction.categoryId ? CATEGORY_MAP[transaction.categoryId] || '-' : '-',
      }
    },
    [updatingTransactionData]
  )

  return {
    updateTransactionCategory,
    getOptimisticCategory,
    isUpdating: fetcher.state !== 'idle',
  }
}
