import { Link } from '@tanstack/react-router'
import { useSyncMutation } from '../hooks/useSyncMutation'
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
      </header>

      <main className='p-4 overflow-y-auto'>{children}</main>

      <Toast />
    </div>
  )
}
