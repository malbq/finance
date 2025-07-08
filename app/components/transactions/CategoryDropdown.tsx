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

const excludedCategories = [
  '01000000',
  '01020000',
  '01030000',
  '01040000',
  '02000000',
  '02010000',
  '02020000',
  '02030000',
  '02030003',
  '02040000',
  '03000000',
  '03010000',
  '03030000',
  '03050000',
  '03060000',
  '03070000',
  '04010000',
  '04030000',
  '04020000',
  '05000000',
  '05010000',
  '05020000',
  '05030000',
  '05040000',
  '05050000',
  '05060000',
  '05070000',
  '05080000',
  '05090000',
  '05090001',
  '05090002',
  '05090003',
  '05090004',
  '05090005',
  '06000000',
  '06010000',
  '06020000',
  '07010001',
  '07010002',
  '07010003',
  '07020002',
  '07020004',
  '07040000',
  '07040001',
  '07040002',
  '07040003',
  '07030001',
  '07030002',
  '07030003',
  '08030000',
  '08060000',
  '08070000',
  '08090000',
  '09010000',
  '11000000',
  '12030000',
  '12040000',
  '14000000',
  '14010000',
  '14020000',
  '15010000',
  '15020000',
  '15030000',
  '16010000',
  '16020000',
  '16030000',
  '17020000',
  '17030000',
  '17040000',
  '18030000',
  '18040000',
  '19000000',
  '19020000',
  '19030000',
  '19040000',
  '19050000',
  '19050003',
  '19050004',
  '200100000',
  '200200000',
  '200300000',
  '200400000',
]

const sortedCategories = Object.entries(CATEGORY_MAP)
  .filter(([id]) => !excludedCategories.includes(id))
  .sort((a, b) => a[1].localeCompare(b[1]))

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
