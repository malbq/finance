import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { type SerializedBootstrapData, localStore } from '../lib/localStore'

/**
 * Hook to fetch bootstrap data and hydrate the local store.
 * Supports incremental sync via cursor:
 * - If no local cursor exists, fetches full data and calls hydrateFull()
 * - If local cursor exists, fetches delta with since=cursor and calls applyDelta()
 */
export function useBootstrapQuery() {
  const queryClient = useQueryClient()

  const query = useQuery<SerializedBootstrapData>({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      const cursor = localStore.getBootstrapCursor()
      const url = cursor
        ? `/api/bootstrap?since=${cursor}`
        : '/api/bootstrap'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch bootstrap data')
      }
      return await response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Hydrate or apply delta to local store when data is fetched
  useEffect(() => {
    if (query.data) {
      if (query.data.isDelta) {
        localStore.applyDelta(query.data)
      } else {
        localStore.hydrateFull(query.data)
      }
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
