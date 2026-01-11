import type { AccountType } from '../../../domain/Account'
import type { Transaction } from '../../../domain/Transaction'
import { useTransactionFilters } from '../../hooks/useTransactionFilters'
import { CreditCardTransactionRow } from './CreditCardTransactionRow'
import { TransactionFilters } from './TransactionFilters'
import { TransactionRow } from './TransactionRow'

interface TransactionTableProps {
  transactions: Transaction[]
  accountType: AccountType
}

export const TransactionTable = ({ transactions, accountType }: TransactionTableProps) => {
  const { filters, updateFilter, filteredTransactions } = useTransactionFilters(
    transactions,
    accountType
  )

  return (
    <div>
      <table className='min-w-full'>
        <TransactionFilters
          filters={filters}
          onFilterChange={updateFilter}
          accountType={accountType}
        />

        <tbody className='overflow-y-auto h-[600px]'>
          {filteredTransactions.map((transaction) => {
            const TransactionRowComponent =
              accountType === 'CREDIT' ? CreditCardTransactionRow : TransactionRow

            return (
              <TransactionRowComponent
                key={transaction.id}
                transaction={transaction}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
