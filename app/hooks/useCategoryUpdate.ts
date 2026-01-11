import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { CATEGORY_MAP } from '../../domain/Categories'
import type { Transaction } from '../../domain/Transaction'

export const useCategoryUpdate = () => {
  const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const updateTransactionCategory = useCallback(
    async (transactionId: string, categoryId: string) => {
      setUpdatingTransactionId(transactionId)
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

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      } catch (error) {
        console.error('Error updating transaction category:', error)
      } finally {
        setUpdatingTransactionId(null)
      }
    },
    [queryClient]
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
  }
}
