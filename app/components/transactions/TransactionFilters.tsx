import type { AccountType } from '~/domain/accounts/entities/Account'
import type { TransactionFilters as TFilters } from '~/hooks/useTransactionFilters'

interface TransactionFiltersProps {
  filters: TFilters
  onFilterChange: (column: keyof TFilters, value: string) => void
  accountType: AccountType
}

export const TransactionFilters = ({
  filters,
  onFilterChange,
  accountType,
}: TransactionFiltersProps) => {
  return (
    <thead>
      <tr className='border-b border-zinc-600'>
        <th className='w-[1px] px-2 py-1 text-start text-xs font-medium text-zinc-400'>
          <div>DATA</div>
          <input
            type='text'
            placeholder='Filtrar data'
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className='mt-1 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </th>

        {accountType === 'CREDIT' && (
          <th className='w-[1px] px-2 py-1 text-start text-xs font-medium text-zinc-400'>
            PARCELA
          </th>
        )}

        {accountType === 'CREDIT' && (
          <th className='w-[1px] px-2 py-1 text-start text-xs font-medium text-zinc-400'>
            COMPRA ORIGINAL
          </th>
        )}

        <th className='px-2 py-1 text-start text-xs font-medium text-zinc-400'>
          DESCRIÇÃO
          <input
            type='text'
            placeholder='Filtrar descrição'
            value={filters.description}
            onChange={(e) => onFilterChange('description', e.target.value)}
            className='mt-1 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </th>

        <th className='px-2 py-1 text-start text-xs font-medium text-zinc-400'>
          DETALHES
          <input
            type='text'
            placeholder='Filtrar detalhes'
            value={filters.details || ''}
            onChange={(e) => onFilterChange('details', e.target.value)}
            className='mt-1 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </th>

        <th className='px-2 py-1 text-start text-xs font-medium text-zinc-400'>
          CATEGORIA
          <input
            type='text'
            placeholder='Filtrar categoria'
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className='mt-1 w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </th>

        <th className='w-[1px] px-2 py-1 text-xs font-medium text-zinc-400'>
          VALOR
        </th>
      </tr>
    </thead>
  )
}
