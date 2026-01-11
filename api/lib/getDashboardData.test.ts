import { Database } from 'bun:sqlite'
import { beforeAll, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from '../db/schema'
import { getDashboardData } from './getDashboardData'

describe('GetDashboardData', () => {
  let db: ReturnType<typeof drizzle>

  beforeAll(() => {
    const sqlite = new Database('./db/finance.db')
    db = drizzle(sqlite, { schema })
  })

  test('should execute and return dashboard data', async () => {
    const result = await getDashboardData(db)
    expect(result).toBeDefined()
    expect(result.spendingByCategory).toBeDefined()
    expect(Array.isArray(result.spendingByCategory)).toBe(true)
    expect(result.spendingByCategory.length).toBeGreaterThan(0)
  })
})
