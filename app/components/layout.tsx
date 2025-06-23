import { useState } from 'react'
import { NavLink, useRevalidator } from 'react-router'
import { Toast, toast } from './toast'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const revalidator = useRevalidator()

  const handleSync = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        revalidator.revalidate()
      } else {
        toast.error(data.error || 'Sync failed')
      }
    } catch {
      toast.error('Network error occurred during sync')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="bg-zinc-800 border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-2">
            <nav className="flex space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`
                }
              >
                Transactions
              </NavLink>
              <NavLink
                to="/investments"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`
                }
              >
                Investments
              </NavLink>
            </nav>

            <button
              onClick={handleSync}
              disabled={isLoading}
              className="bg-transparent border border-blue-500/50 hover:bg-blue-700/20 disabled:bg-blue-400 text-white px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="opacity-75"
                    />
                  </svg>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Sync Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 pb-60">{children}</main>

      <Toast />
    </div>
  )
}
