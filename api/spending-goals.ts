import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { CategoryId } from '../domain/Categories'
import { spendingGoal } from './db/schema'

function toNullableNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function clampTolerance(value: number | null): number | null {
  if (value === null) return null
  if (!Number.isFinite(value)) return null
  if (value < 0) return 0
  if (value > 99) return 99
  return Math.round(value)
}

type Db = ReturnType<typeof drizzle>

export function createSpendingGoalsHandler(db: Db) {
  return {
    async POST(req: Request) {
      const body = (await req.json()) as {
        categoryId?: string
        goal?: unknown
        tolerance?: unknown
      }

      const categoryId = body.categoryId as CategoryId | undefined
      if (!categoryId) {
        return Response.json({ error: 'Invalid parameters: categoryId is required' }, { status: 400 })
      }

      const goal = toNullableNumber(body.goal)
      const tolerance = clampTolerance(toNullableNumber(body.tolerance))

      if (goal !== null && goal < 0) {
        return Response.json({ error: 'Invalid parameters: goal must be >= 0' }, { status: 400 })
      }

      const now = Date.now()

      // Create on first write; never delete.
      // Null values mean "blank" in the UI.
      const existing = await db
        .select({ categoryId: spendingGoal.categoryId })
        .from(spendingGoal)
        .where(eq(spendingGoal.categoryId, categoryId))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(spendingGoal).values({
          categoryId,
          goal,
          tolerance,
          updatedAt: now,
        })
      } else {
        await db
          .update(spendingGoal)
          .set({
            goal,
            tolerance,
            updatedAt: now,
          })
          .where(eq(spendingGoal.categoryId, categoryId))
      }

      return Response.json({ success: true, data: { categoryId, goal, tolerance } })
    },
  }
}
