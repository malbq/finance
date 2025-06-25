import { memo } from 'react'
import type { Transaction } from '~/domain/transactions/entities/Transaction'

interface CreditCardTransactionRowProps {
  transaction: Transaction
  isUpdating: boolean
  getOptimisticCategory: (transaction: Transaction) => {
    categoryName: string | null
  }
  onCategoryCellClick: (event: React.MouseEvent, transactionId: string) => void
}

export const CreditCardTransactionRow = memo(function CreditCardTransactionRow({
  transaction,
  isUpdating,
  getOptimisticCategory,
  onCategoryCellClick,
}: CreditCardTransactionRowProps) {
  const { categoryName } = getOptimisticCategory(transaction)
  const isInstallment =
    transaction.creditCardMetadata?.totalInstallments &&
    transaction.creditCardMetadata?.installmentNumber
  const isLastInstallment =
    isInstallment &&
    transaction.creditCardMetadata!.installmentNumber! ===
      transaction.creditCardMetadata!.totalInstallments!

  return (
    <tr
      key={transaction.id}
      className={`not-last:border-b border-zinc-700 hover:bg-zinc-800/50 ${
        isUpdating ? 'opacity-50' : ''
      }`}
    >
      <td
        className={`px-4 py-1 text-sm text-zinc-100 whitespace-nowrap ${
          transaction.futurePayment ? 'bg-yellow-900/30' : ''
        }`}
      >
        {transaction.dateFormatted} {transaction.futurePayment ? '🕰️' : ''}
      </td>

      <td
        className={`px-4 py-1  text-sm text-center whitespace-nowrap ${
          isLastInstallment ? 'text-blue-400 font-medium' : 'text-zinc-400'
        }`}
      >
        {isInstallment && (
          <>
            {transaction.creditCardMetadata!.installmentNumber!}/
            {transaction.creditCardMetadata!.totalInstallments!}
          </>
        )}
      </td>

      <td className="px-4 py-1  text-sm text-zinc-400">
        {transaction.creditCardMetadata?.purchaseDateFormatted}
      </td>

      <td className="px-4 py-1  text-sm text-zinc-100">
        {transaction.description}
      </td>

      <td className="px-4 py-1 text-sm text-zinc-100">
        {transaction.merchant?.name}
        {transaction.merchant?.name && transaction.merchant?.businessName && (
          <br />
        )}
        {transaction.merchant?.businessName}
      </td>

      <td className="px-2 py-0  text-sm text-zinc-100">
        <div
          className="px-2 py-1 cursor-pointer hover:bg-zinc-700/50 rounded text-zinc-100"
          onClick={(e) => onCategoryCellClick(e, transaction.id)}
        >
          {categoryName}
        </div>
      </td>

      <td className="px-4 py-1  text-sm text-end">
        <div
          className={` ${
            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {transaction.amountFormatted}
        </div>
      </td>
    </tr>
  )
})
