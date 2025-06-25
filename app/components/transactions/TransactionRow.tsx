import { memo } from 'react'
import type { AccountType } from '~/domain/accounts/entities/Account'
import type { Transaction } from '~/domain/transactions/entities/Transaction'

interface TransactionRowProps {
  transaction: Transaction
  isUpdating: boolean
  accountType: AccountType
  getOptimisticCategory: (transaction: Transaction) => {
    categoryName: string | null
  }
  onCategoryCellClick: (event: React.MouseEvent, transactionId: string) => void
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  isUpdating,
  accountType,
  getOptimisticCategory,
  onCategoryCellClick,
}: TransactionRowProps) {
  const { categoryName } = getOptimisticCategory(transaction)

  const merchantName =
    transaction.merchant?.name &&
    transaction.merchant.name !== transaction.paymentData?.receiver?.name
      ? transaction.merchant.name
      : ''

  return (
    <tr
      key={transaction.id}
      className={`border-b border-zinc-700 hover:bg-zinc-800/50 ${
        isUpdating ? 'opacity-50' : ''
      }`}
    >
      <td className="px-4 py-2 text-sm text-zinc-100">
        {transaction.dateFormatted}
      </td>

      <td className="px-4 py-2 text-sm text-zinc-100">
        {transaction.description}
      </td>

      {accountType === 'BANK' && (
        <td className="px-4 py-2 text-xs text-zinc-100">
          {transaction.paymentData?.payer?.name ? (
            <div>
              {transaction.paymentData.payer.name}
              {transaction.paymentData.payer.documentValue && (
                <span className="text-zinc-400">
                  {' '}
                  ({transaction.paymentData.payer.documentValue})
                </span>
              )}
            </div>
          ) : (
            <>
              {merchantName}
              {merchantName.length > 0 && transaction.paymentData?.receiver && (
                <br />
              )}
              {transaction.paymentData?.receiver?.name && (
                <>
                  {transaction.paymentData.receiver.name}
                  {transaction.paymentData.receiver.documentValue && (
                    <span className="text-zinc-400">
                      {' '}
                      ({transaction.paymentData.receiver.documentValue})
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </td>
      )}

      <td className="px-2 py-0 text-sm text-zinc-100">
        <div
          className="px-2 py-1 cursor-pointer hover:bg-zinc-700/50 rounded"
          onClick={(e) => onCategoryCellClick(e, transaction.id)}
        >
          {categoryName || '-'}
        </div>
      </td>

      <td className="px-4 py-2 text-sm text-end font-medium">
        <div
          className={`${
            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {transaction.amountFormatted}
        </div>
      </td>
    </tr>
  )
})
