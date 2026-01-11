import { useQuery } from '@tanstack/react-query'
import type { TransactionsData } from '../../api/lib/GetTransactionsData'

export function useTransactionsData() {
  return useQuery<TransactionsData>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions')
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      return await response.json()
    },
  })
}
