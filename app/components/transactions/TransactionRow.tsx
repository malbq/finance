import { memo } from 'react'
import type { Transaction } from '~/domain/transactions/entities/Transaction'
import { useCategoryUpdate } from '~/hooks/useCategoryUpdate'
import { CategoryDropdown } from './CategoryDropdown'

interface TransactionRowProps {
  transaction: Transaction
}

export const TransactionRow = memo(function TransactionRow({ transaction }: TransactionRowProps) {
  const { updateTransactionCategory, getOptimisticCategory, isUpdating } = useCategoryUpdate()
  const { categoryId } = getOptimisticCategory(transaction)

  const merchantName =
    transaction.merchant?.name &&
    transaction.merchant.name !== transaction.paymentData?.receiver?.name
      ? transaction.merchant.name
      : ''

  const copyTransactionId = () => {
    navigator.clipboard.writeText(transaction.id)
  }

  return (
    <tr
      key={transaction.id}
      className={`not-last:border-b border-zinc-700 hover:bg-zinc-700/50 group ${
        isUpdating ? 'opacity-50' : ''
      }`}
    >
      <td className='px-2 py-1 text-sm text-zinc-100 relative'>
        <button
          onClick={copyTransactionId}
          className='absolute left-[-10px] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 bg-zinc-600 hover:bg-zinc-500 text-zinc-100 p-1 rounded-full text-xs font-mono border border-zinc-500 z-10'
          title='Copy transaction ID'
        >
          ID
        </button>
        {transaction.dateFormatted}
      </td>

      <td className='px-2 py-1 text-sm text-zinc-100'>{transaction.description}</td>

      <td className='px-2 py-1 text-xs text-zinc-100'>
        {transaction.paymentData?.payer?.name ? (
          <div>
            {transaction.paymentData.payer.name}
            {transaction.paymentData.payer.documentValue && (
              <span className='text-zinc-400'>
                {' '}
                ({transaction.paymentData.payer.documentValue})
              </span>
            )}
          </div>
        ) : (
          <>
            {merchantName}
            {merchantName.length > 0 && transaction.paymentData?.receiver && <br />}
            {transaction.paymentData?.receiver?.name && (
              <>
                {transaction.paymentData.receiver.name}
                {transaction.paymentData.receiver.documentValue && (
                  <span className='text-zinc-400'>
                    {' '}
                    ({transaction.paymentData.receiver.documentValue})
                  </span>
                )}
              </>
            )}
          </>
        )}
      </td>

      <td className='text-sm'>
        <CategoryDropdown
          transactionId={transaction.id}
          categoryId={categoryId ?? transaction.categoryId}
          onCategorySelect={updateTransactionCategory}
        />
      </td>

      <td className='px-2 py-1 text-sm text-end font-medium'>
        <div className={`${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {transaction.amountFormatted}
        </div>
      </td>
    </tr>
  )
})
