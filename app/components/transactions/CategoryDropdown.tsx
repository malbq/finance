import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useMemo, useState } from 'react'
import {
  CATEGORY_MAP,
  excludedCategories,
  sortedCategories,
  type CategoryId,
} from '../../domain/transactions/entities/Categories'

interface CategoryDropdownProps {
  transactionId: string
  categoryId?: CategoryId
  onCategorySelect: (transactionId: string, categoryId: CategoryId) => void
}

export const CategoryDropdown = ({
  transactionId,
  categoryId,
  onCategorySelect,
}: CategoryDropdownProps) => {
  const [query, setQuery] = useState('')

  const filteredCategories = useMemo(() => {
    if (query === '') {
      return sortedCategories
    }
    return sortedCategories.filter((category) =>
      category[1].toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  const handleSelect = (categoryId: CategoryId | null) => {
    if (categoryId) {
      onCategorySelect(transactionId, categoryId)
      setQuery('')
    }
  }

  return (
    <Combobox
      immediate
      value={categoryId}
      onChange={handleSelect}
      onClose={() => setQuery('')}
    >
      <ComboboxInput
        className={`px-2 py-1 cursor-pointer hover:bg-zinc-700/50 rounded ${categoryId && excludedCategories.includes(categoryId) ? 'italic text-zinc-500' : ''}`}
        displayValue={(categoryId?: CategoryId) => (categoryId ? CATEGORY_MAP[categoryId] : '')}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
      />
      <ComboboxOptions
        anchor='bottom start'
        className='bg-zinc-700 border border-zinc-600 border-t-0 rounded-b-lg shadow-lg max-h-80 overflow-y-auto w-[--input-width]'
      >
        {filteredCategories.length === 0 && query !== '' ? (
          <div className='px-3 py-2 text-sm text-zinc-400'>No categories found.</div>
        ) : (
          filteredCategories.map((category) => (
            <ComboboxOption
              key={category[0]}
              className='cursor-pointer select-none px-3 py-2 text-sm text-white data-[focus]:bg-zinc-600'
              value={category[0]}
            >
              {category[1]}
            </ComboboxOption>
          ))
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
