import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFetcher } from 'react-router'
import { getCategoryIcon } from '../utils/categoryIcon'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { formatTime } from '../utils/formatTime'

interface AccountTransactionsTableProps {
  transactions: any[] // Raw transactions from optimized loader
  categories: Array<{ id: string; name: string }>
}

interface CategoryDropdownState {
  isOpen: boolean
  transactionId: string | null
  position: { top: number; left: number }
}

export function AccountTransactionsTable({
  transactions,
  categories,
}: AccountTransactionsTableProps) {
  const [filters, setFilters] = useState({
    date: '',
    description: '',
    details: '',
    category: '',
  })

  const [categoryDropdown, setCategoryDropdown] =
    useState<CategoryDropdownState>({
      isOpen: false,
      transactionId: null,
      position: { top: 0, left: 0 },
    })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const fetcher = useFetcher()

  // Close dropdown when clicking outside
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

  // Memoize category lookup map for faster access
  const categoryMap = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat.name])),
    [categories]
  )

  // Format transactions on client side for better performance
  const formattedTransactions = useMemo(() => {
    return transactions.map((transaction) => ({
      ...transaction,
      amountFormatted: formatCurrency(transaction.amount),
      amountInAccountCurrencyFormatted: transaction.amountInAccountCurrency
        ? formatCurrency(transaction.amountInAccountCurrency)
        : null,
      balanceFormatted: transaction.balance
        ? formatCurrency(transaction.balance)
        : null,
      dateFormatted: formatDate(transaction.date),
      timeFormatted: formatTime(transaction.date),
      categoryIcon: getCategoryIcon(transaction.category),
    }))
  }, [transactions])

  // Memoize updating transaction ID and category ID for optimistic updates
  const updatingTransactionData = useMemo(() => {
    if (fetcher.state === 'idle' || !fetcher.formData) {
      return null
    }
    return {
      transactionId: fetcher.formData.get('transactionId') as string,
      categoryId: fetcher.formData.get('categoryId') as string,
    }
  }, [fetcher.state, fetcher.formData])

  // Memoize filtered transactions to avoid recalculating on every render
  const filteredTransactions = useMemo(() => {
    if (
      !filters.date &&
      !filters.description &&
      !filters.details &&
      !filters.category
    ) {
      return formattedTransactions
    }

    const dateFilter = filters.date.toLowerCase()
    const descriptionFilter = filters.description.toLowerCase()
    const detailsFilter = filters.details.toLowerCase()
    const categoryFilter = filters.category.toLowerCase()

    return formattedTransactions.filter((transaction) => {
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
        ].join(' ')
        detailsMatch = detailsText.toLowerCase().includes(detailsFilter)
      }

      const categoryMatch =
        !categoryFilter ||
        (transaction.category || '').toLowerCase().includes(categoryFilter)

      return dateMatch && descriptionMatch && detailsMatch && categoryMatch
    })
  }, [
    formattedTransactions,
    filters.date,
    filters.description,
    filters.details,
    filters.category,
  ])

  const updateFilter = useCallback(
    (column: keyof typeof filters, value: string) => {
      setFilters((prev) => ({ ...prev, [column]: value }))
    },
    []
  )

  const updateTransactionCategory = useCallback(
    (transactionId: string, categoryId: string) => {
      fetcher.submit({ transactionId, categoryId }, { method: 'post' })
      setCategoryDropdown((prev) => ({ ...prev, isOpen: false }))
    },
    [fetcher]
  )

  // Handle category cell click
  const handleCategoryCellClick = useCallback(
    (event: React.MouseEvent, transactionId: string) => {
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      const containerRect = event.currentTarget
        .closest('.overflow-x-auto')
        ?.getBoundingClientRect()

      if (!containerRect) return

      setCategoryDropdown({
        isOpen: true,
        transactionId,
        position: {
          top: rect.bottom - containerRect.top,
          left: rect.left - containerRect.left,
        },
      })
    },
    []
  )

  // Memoize optimistic category function
  const getOptimisticCategory = useCallback(
    (transaction: any) => {
      if (
        updatingTransactionData &&
        updatingTransactionData.transactionId === transaction.id
      ) {
        return {
          categoryId: updatingTransactionData.categoryId,
          categoryName:
            categoryMap.get(updatingTransactionData.categoryId) || null,
        }
      }

      return {
        categoryId: transaction.categoryId,
        categoryName: transaction.category,
      }
    },
    [updatingTransactionData, categoryMap]
  )

  return (
    <div className="overflow-x-auto relative">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-zinc-600">
            <th className="p-4 text-start text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Data
              <input
                type="text"
                placeholder="Filtrar data..."
                value={filters.date}
                onChange={(e) => updateFilter('date', e.target.value)}
                className="mt-2 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th className="p-4 text-start text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Descrição
              <input
                type="text"
                placeholder="Filtrar descrição..."
                value={filters.description}
                onChange={(e) => updateFilter('description', e.target.value)}
                className="mt-2 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th className="p-4 text-start text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Detalhes
              <input
                type="text"
                placeholder="Filtrar detalhes..."
                value={filters.details}
                onChange={(e) => updateFilter('details', e.target.value)}
                className="mt-2 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th className="p-4 text-start text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Categoria
              <input
                type="text"
                placeholder="Filtrar categoria..."
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="mt-2 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th className="p-4 text-end text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Valor
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-600">
          {filteredTransactions.map((transaction) => (
            <AccountTransactionRow
              key={transaction.id}
              transaction={transaction}
              categories={categories}
              isUpdating={
                updatingTransactionData?.transactionId === transaction.id
              }
              getOptimisticCategory={getOptimisticCategory}
              onCategoryCellClick={handleCategoryCellClick}
            />
          ))}
        </tbody>
      </table>

      {/* Shared Category Dropdown */}
      {categoryDropdown.isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-zinc-700 border border-zinc-600 rounded shadow-lg py-1 w-60 max-h-64 overflow-y-auto"
          style={{
            top: categoryDropdown.position.top,
            left: categoryDropdown.position.left,
          }}
        >
          {categories
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  updateTransactionCategory(
                    categoryDropdown.transactionId!,
                    category.id
                  )
                }
                className="w-full text-start px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-600 transition-colors"
              >
                {category.name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// Memoized row component to prevent unnecessary re-renders
const AccountTransactionRow = React.memo(function AccountTransactionRow({
  transaction,
  categories,
  isUpdating,
  getOptimisticCategory,
  onCategoryCellClick,
}: {
  transaction: any
  categories: Array<{ id: string; name: string }>
  isUpdating: boolean
  getOptimisticCategory: (transaction: any) => {
    categoryId: string | null
    categoryName: string | null
  }
  onCategoryCellClick: (event: React.MouseEvent, transactionId: string) => void
}) {
  const { categoryId, categoryName } = getOptimisticCategory(transaction)

  return (
    <tr className="hover:bg-slate-800 transition-colors">
      <td className="px-4 py-2 whitespace-nowrap text-sm text-white">
        {transaction.dateFormatted}
      </td>
      <td className="px-4 py-2">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          <span>{transaction.description}</span>
          {transaction.paymentData?.paymentMethod && (
            <span className="px-1 rounded-full text-xs bg-zinc-600 text-zinc-300">
              {transaction.paymentData.paymentMethod}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-2">
        {transaction.paymentData?.payer && (
          <div className="text-xs text-zinc-400 mt-1">
            Pagador:{' '}
            {transaction.paymentData.payer.name ??
              transaction.paymentData.payer.documentValue ??
              ''}
          </div>
        )}
        {transaction.paymentData?.receiver && (
          <div className="text-xs text-zinc-400 mt-1">
            Recebedor:{' '}
            {transaction.paymentData.receiver.name ??
              transaction.paymentData.receiver.documentValue ??
              ''}
          </div>
        )}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm">
        <div
          className={`flex items-center gap-2 cursor-pointer hover:bg-zinc-600 rounded px-2 py-1 transition-colors ${
            isUpdating ? 'opacity-75' : ''
          }`}
          onClick={(e) => onCategoryCellClick(e, transaction.id)}
          title="Clique para alterar categoria"
        >
          <span className="text-zinc-300">
            {getCategoryIcon(categoryName)} {categoryName || 'Sem categoria'}
          </span>
          <svg
            className="w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {isUpdating && (
            <span className="text-xs text-zinc-400 ml-2">Salvando...</span>
          )}
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-end">
        <div
          className={`text-sm font-semibold ${
            transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {transaction.amount >= 0 ? '+' : ''}
          {transaction.amountFormatted}
        </div>
        {transaction.balanceFormatted && (
          <div className="text-xs text-zinc-400">
            Balance: {transaction.balanceFormatted}
          </div>
        )}
      </td>
    </tr>
  )
})
