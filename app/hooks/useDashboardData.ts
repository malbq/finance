import { useQuery } from '@tanstack/react-query'
import type { DashboardData } from '../../api/lib/getDashboardData'

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return await response.json()
    },
  })
}
