import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useSyncMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Sync failed' }))
        throw new Error(error.error || 'Sync failed')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate bootstrap query to refetch all data and rehydrate local store
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}
