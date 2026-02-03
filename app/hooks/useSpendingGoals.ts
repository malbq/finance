import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { CategoryId } from '../../domain/Categories'
import { localStore } from '../lib/localStore'
import { useBootstrapQuery } from './useBootstrapQuery'

type SpendingGoalInputs = {
  goal: number | null
  tolerance: number | null
}

export function useSpendingGoal(categoryId: CategoryId): SpendingGoalInputs {
  return useSyncExternalStore(
    (callback) => localStore.subscribeSpendingGoal(categoryId, callback),
    () => localStore.getSpendingGoal(categoryId),
    () => localStore.getSpendingGoal(categoryId)
  )
}

type Goal = {
  goal: number | null
  tolerance: number | null
}

function toNullableNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clampTolerance(value: number | null): number | null {
  if (value === null) return null
  if (value < 0) return 0
  if (value > 99) return 99
  return Math.round(value)
}

function normalizeGoal(goal: Goal): Goal {
  return {
    goal: goal.goal,
    tolerance: clampTolerance(goal.tolerance),
  }
}

export function useSpendingGoals() {
  const bootstrapQuery = useBootstrapQuery()

  const snapshot = useSyncExternalStore(
    (callback) => localStore.subscribe(callback),
    () => localStore.getSnapshot()
  )

  const mutation = useMutation({
    mutationFn: async (params: { categoryId: CategoryId; goal: Goal }) => {
      await fetch('/api/spending-goals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          categoryId: params.categoryId,
          goal: params.goal.goal,
          tolerance: params.goal.tolerance,
        }),
      })
    },
    onError: () => {
      // Local-first: next edits will retry.
    },
  })

  const pendingRef = useRef(new Map<CategoryId, Goal>())
  const debounceTimerRef = useRef<number | null>(null)

  const flush = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const entries = Array.from(pendingRef.current.entries())
    pendingRef.current.clear()

    entries.forEach(([categoryId, goal]) => {
      mutation.mutate({ categoryId, goal })
    })
  }, [mutation])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const scheduleFlush = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null
      flush()
    }, 500)
  }, [flush])

  const updateGoal = useCallback(
    (
      categoryId: CategoryId,
      updates: {
        goalInput?: string
        toleranceInput?: string
      }
    ) => {
      const current = localStore.getSpendingGoal(categoryId)

      const next: Goal = normalizeGoal({
        goal: updates.goalInput !== undefined ? toNullableNumber(updates.goalInput) : current.goal,
        tolerance:
          updates.toleranceInput !== undefined ? toNullableNumber(updates.toleranceInput) : current.tolerance,
      })

      localStore.upsertSpendingGoal(categoryId, next)

      pendingRef.current.set(categoryId, next)
      scheduleFlush()
    },
    [scheduleFlush]
  )

  const getGoal = useCallback((categoryId: CategoryId): Goal => {
    return localStore.getSpendingGoal(categoryId)
  }, [])

  const goalsByCategory = localStore.getSpendingGoals()

  return useMemo(
    () => ({
      goalsByCategory,
      getGoal,
      updateGoal,
      flush,
      isLoading: bootstrapQuery.isLoading,
      error: bootstrapQuery.error,
      snapshot,
    }),
    [bootstrapQuery.error, bootstrapQuery.isLoading, flush, getGoal, goalsByCategory, snapshot, updateGoal]
  )
}
