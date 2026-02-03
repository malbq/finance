import { useCallback, useState } from 'react'
import { CATEGORY_MAP, type CategoryId } from '../../domain/Categories'
import type { Transaction } from '../../domain/Transaction'
import { localStore } from '../lib/localStore'

export const useCategoryUpdate = () => {
  const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null)

  const updateTransactionCategory = useCallback(
    async (transactionId: string, categoryId: CategoryId) => {
      setUpdatingTransactionId(transactionId)

      // Capture previous state for rollback
      const previousTransaction = localStore.getTransaction(transactionId)
      const previousCategoryId = previousTransaction?.categoryId

      // Optimistic update - update local store immediately
      localStore.updateTransaction(transactionId, { categoryId })

      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transactionId, categoryId }),
        })

        if (!response.ok) {
          throw new Error('Failed to update transaction category')
        }

        // No query invalidation - rely on optimistic update
        // Next delta sync will pick up the change if needed
      } catch (error) {
        console.error('Error updating transaction category:', error)

        // Rollback on failure
        if (previousCategoryId !== undefined) {
          localStore.updateTransaction(transactionId, { categoryId: previousCategoryId })
        }
      } finally {
        setUpdatingTransactionId(null)
      }
    },
    []
  )

  const getOptimisticCategory = useCallback((transaction: Transaction) => {
    return {
      categoryId: transaction.categoryId,
      categoryName: transaction.categoryId ? CATEGORY_MAP[transaction.categoryId] || '-' : '-',
    }
  }, [])

  return {
    updateTransactionCategory,
    getOptimisticCategory,
    isUpdating: updatingTransactionId !== null,
    updatingTransactionId,
  }
}
