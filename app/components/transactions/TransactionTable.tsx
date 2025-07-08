import type { AccountType } from '~/domain/accounts/entities/Account'
import type { Transaction } from '../../domain/transactions/entities/Transaction'
import { useCategoryUpdate } from '../../hooks/useCategoryUpdate'
import { useTransactionFilters } from '../../hooks/useTransactionFilters'
import { CategoryDropdown } from './CategoryDropdown'
import { CreditCardTransactionRow } from './CreditCardTransactionRow'
import { TransactionFilters } from './TransactionFilters'
import { TransactionRow } from './TransactionRow'

interface TransactionTableProps {
  transactions: Transaction[]
  accountType: AccountType
}

export const TransactionTable = ({
  transactions,
  accountType,
}: TransactionTableProps) => {
  const { filters, updateFilter, filteredTransactions } = useTransactionFilters(
    transactions,
    accountType
  )

  const {
    categoryDropdown,
    dropdownRef,
    updateTransactionCategory,
    handleCategoryCellClick,
    getOptimisticCategory,
    isUpdating,
  } = useCategoryUpdate()

  return (
    <>
      <table className='min-w-full'>
        <TransactionFilters
          filters={filters}
          onFilterChange={updateFilter}
          accountType={accountType}
        />

        <tbody>
          {filteredTransactions.map((transaction) => {
            const TransactionRowComponent =
              accountType === 'CREDIT'
                ? CreditCardTransactionRow
                : TransactionRow

            return (
              <TransactionRowComponent
                key={transaction.id}
                transaction={transaction}
                isUpdating={isUpdating}
                accountType={accountType}
                getOptimisticCategory={getOptimisticCategory}
                onCategoryCellClick={handleCategoryCellClick}
              />
            )
          })}
        </tbody>
      </table>

      <CategoryDropdown
        ref={dropdownRef}
        categoryDropdown={categoryDropdown}
        onCategorySelect={updateTransactionCategory}
      />
    </>
  )
}
