import { forwardRef } from 'react'
import { CATEGORY_MAP } from '../../domain/transactions/entities/Categories'

interface CategoryDropdownState {
  isOpen: boolean
  transactionId: string | null
  position: { top: number; left: number }
}

interface CategoryDropdownProps {
  categoryDropdown: CategoryDropdownState
  onCategorySelect: (transactionId: string, categoryId: string) => void
}

const sortedCategories = Object.entries(CATEGORY_MAP).sort((a, b) =>
  a[1].localeCompare(b[1])
)

export const CategoryDropdown = forwardRef<
  HTMLDivElement,
  CategoryDropdownProps
>(function CategoryDropdown({ categoryDropdown, onCategorySelect }, ref) {
  if (!categoryDropdown.isOpen || !categoryDropdown.transactionId) {
    return null
  }

  return (
    <div
      ref={ref}
      className='fixed z-50 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg max-h-48 overflow-y-auto'
      style={{
        top: categoryDropdown.position.top,
        left: categoryDropdown.position.left,
      }}
    >
      <div className='py-1'>
        {sortedCategories.map((category) => (
          <button
            key={category[0]}
            type='button'
            className='w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-600 focus:bg-zinc-600 focus:outline-none'
            onClick={() =>
              onCategorySelect(categoryDropdown.transactionId!, category[0])
            }
          >
            {category[1]}
          </button>
        ))}
      </div>
    </div>
  )
})
