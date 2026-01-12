import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import type { BootstrapData } from '../../api/bootstrap'
import { localStore } from '../lib/localStore'

/**
 * Hook to fetch bootstrap data and hydrate the local store.
 * This is the single source of truth for loading data from the server.
 */
export function useBootstrapQuery() {
  const queryClient = useQueryClient()

  const query = useQuery<BootstrapData>({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      const response = await fetch('/api/bootstrap')
      if (!response.ok) {
        throw new Error('Failed to fetch bootstrap data')
      }
      return await response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Hydrate local store when data is fetched
  useEffect(() => {
    if (query.data) {
      localStore.hydrate(query.data)
    }
  }, [query.data])

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  }, [queryClient])

  return {
    ...query,
    refetch,
  }
}
