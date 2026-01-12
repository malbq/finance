import { Link, useRouterState } from '@tanstack/react-router'
import { CATEGORY_MAP, type CategoryId } from '../../domain/Categories'
import { downloadCsv, toCsv } from '../../utils/downloadCsv'
import { excludedCategories, useDashboardData } from '../hooks/useDashboardData'
import { useSyncMutation } from '../hooks/useSyncMutation'
import { localStore } from '../lib/localStore'
import { Toast, toast } from './toast'

interface LayoutProps {
  children: React.ReactNode
}

interface NavLink {
  to: string
  label: string
}
const links: NavLink[] = [
  { to: '/', label: 'Home' },
  { to: '/transactions', label: 'Transactions' },
]

export function Layout({ children }: LayoutProps) {
  const syncMutation = useSyncMutation()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Data hooks for export
  const dashboardData = useDashboardData()

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error occurred during sync')
    }
  }

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0]

    if (currentPath === '/') {
      // Dashboard export: spendingByCategory time series as CSV
      if (!dashboardData.data?.spendingByCategory) {
        toast.error('No dashboard data available to export')
        return
      }

      const rows = dashboardData.data.spendingByCategory.map((monthData) => {
        const result: Record<string, unknown> = {
          month: monthData.month,
          total: monthData.total,
          salary: monthData.salary,
        }
        // Add category names for readability
        for (const [key, value] of Object.entries(monthData)) {
          if (key !== 'month' && key !== 'total' && key !== 'salary' && value !== undefined) {
            const categoryName = CATEGORY_MAP[key as CategoryId]
            if (categoryName) {
              result[categoryName] = value
            }
          }
        }
        return result
      })

      const csv = toCsv(rows)
      downloadCsv(`finance-dashboard-spending-${timestamp}.csv`, csv)
      toast.success('Dashboard data exported')
    } else if (currentPath === '/transactions') {
      // Transactions export: all transactions filtered by excludedCategories
      const allTransactions = localStore.getTransactions()

      const filteredTransactions = allTransactions.filter(
        (tx) => !tx.categoryId || !excludedCategories.has(tx.categoryId)
      )

      if (filteredTransactions.length === 0) {
        toast.error('No transactions to export')
        return
      }

      const rows = filteredTransactions.map((tx) => ({
        id: tx.id,
        date: tx.dateFormatted,
        description: tx.description,
        amount: tx.amount,
        amountFormatted: tx.amountFormatted,
        currencyCode: tx.currencyCode,
        categoryId: tx.categoryId ?? '',
        category: tx.category ?? '',
        type: tx.type ?? '',
        status: tx.status ?? '',
        accountId: tx.accountId,
      }))

      const csv = toCsv(rows)
      downloadCsv(`finance-transactions-${timestamp}.csv`, csv)
      toast.success(`Exported ${filteredTransactions.length} transactions`)
    } else {
      toast.error('Export not available for this view')
    }
  }

  const isExportDisabled = !localStore.isHydrated()

  return (
    <div className='min-h-screen h-screen grid grid-rows-[auto_1fr]'>
      <header className='bg-neutral-900 px-4 flex justify-between items-center'>
        <nav className='flex space-x-1'>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeProps={{ className: 'bg-neutral-800' }}
              inactiveProps={{ className: 'hover:bg-neutral-800/50' }}
              className='px-6 py-2 text-sm font-medium transition-colors'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className='flex items-center space-x-2'>
          <button
            onClick={handleExport}
            disabled={isExportDisabled}
            className='bg-green-900/50 hover:bg-green-900 disabled:bg-slate-800 disabled:text-slate-500 px-2 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-2'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
              />
            </svg>
            <span>Export</span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className='bg-blue-900/50 hover:bg-blue-900 disabled:bg-slate-800 px-2 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-2'
          >
            {syncMutation.isPending ? (
              <>
                <svg
                  className='w-4 h-4 animate-spin'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    className='opacity-25'
                  />
                  <path
                    fill='currentColor'
                    d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    className='opacity-75'
                  />
                </svg>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                <span>Sync Data</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className='p-4 overflow-y-auto'>{children}</main>

      <Toast />
    </div>
  )
}
