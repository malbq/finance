import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFetcher } from 'react-router'
import {
  CATEGORY_MAP,
  type CategoryId,
} from '~/domain/transactions/entities/Categories'
import type { Transaction } from '~/domain/transactions/entities/Transaction'

interface CategoryDropdownState {
  isOpen: boolean
  transactionId: string | null
  position: { top: number; left: number }
}

export const useCategoryUpdate = () => {
  const [categoryDropdown, setCategoryDropdown] =
    useState<CategoryDropdownState>({
      isOpen: false,
      transactionId: null,
      position: { top: 0, left: 0 },
    })

  const dropdownRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdown((prev) => ({ ...prev, isOpen: false }))
      }
    }

    if (categoryDropdown.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [categoryDropdown.isOpen])

  const updateTransactionCategory = useCallback(
    (transactionId: string, categoryId: string) => {
      fetcher.submit({ transactionId, categoryId }, { method: 'post' })
      setCategoryDropdown((prev) => ({ ...prev, isOpen: false }))
    },
    [fetcher]
  )

  const handleCategoryCellClick = useCallback(
    (event: React.MouseEvent, transactionId: string) => {
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()

      setCategoryDropdown({
        isOpen: true,
        transactionId,
        position: {
          top: rect.bottom,
          left: rect.left,
        },
      })
    },
    []
  )

  const getOptimisticCategory = useCallback(
    (transaction: Transaction) => {
      if (
        updatingTransactionData &&
        updatingTransactionData.transactionId === transaction.id
      ) {
        return {
          categoryId: updatingTransactionData.categoryId,
          categoryName: updatingTransactionData.categoryId
            ? CATEGORY_MAP[updatingTransactionData.categoryId]
            : '-',
        }
      }

      return {
        categoryId: transaction.categoryId,
        categoryName: transaction.categoryId
          ? CATEGORY_MAP[transaction.categoryId] || '-'
          : '-',
      }
    },
    [updatingTransactionData]
  )

  return {
    categoryDropdown,
    setCategoryDropdown,
    dropdownRef,
    updateTransactionCategory,
    handleCategoryCellClick,
    getOptimisticCategory,
    isUpdating: fetcher.state !== 'idle',
  }
}
