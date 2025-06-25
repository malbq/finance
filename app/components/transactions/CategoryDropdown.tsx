import { forwardRef, useMemo } from 'react'
import type { Category } from '../../domain/transactions/entities/Categories'

interface CategoryDropdownState {
  isOpen: boolean
  transactionId: string | null
  position: { top: number; left: number }
}

interface CategoryDropdownProps {
  categories: Category[]
  categoryDropdown: CategoryDropdownState
  onCategorySelect: (transactionId: string, categoryId: string) => void
}

export const CategoryDropdown = forwardRef<
  HTMLDivElement,
  CategoryDropdownProps
>(function CategoryDropdown(
  { categories, categoryDropdown, onCategorySelect },
  ref
) {
  if (!categoryDropdown.isOpen || !categoryDropdown.transactionId) {
    return null
  }

  const sortedCategories = useMemo(() => {
    return categories.sort((a, b) => {
      return a.descriptionTranslated.localeCompare(b.descriptionTranslated)
    })
  }, [categories])

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      style={{
        top: categoryDropdown.position.top,
        left: categoryDropdown.position.left,
      }}
    >
      <div className="py-1">
        {sortedCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-600 focus:bg-zinc-600 focus:outline-none"
            onClick={() =>
              onCategorySelect(categoryDropdown.transactionId!, category.id)
            }
          >
            {category.descriptionTranslated}
          </button>
        ))}
      </div>
    </div>
  )
})
