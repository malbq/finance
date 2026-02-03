import { describe, expect, test } from 'bun:test'

/**
 * Integration tests for the bootstrap API endpoint.
 * Verifies full load vs delta behavior.
 *
 * IMPORTANT: These tests require the dev server to be running.
 * Start it with: bun run dev
 *
 * Run these tests with: bun test api/bootstrap.test.ts
 */
describe('Bootstrap API', () => {
  const BASE_URL = 'http://localhost:7777'

  test('full load returns isDelta=false and all transactions in window', async () => {
    const response = await fetch(`${BASE_URL}/api/bootstrap`)
    expect(response.ok).toBe(true)

    const data = await response.json()

    expect(data.isDelta).toBe(false)
    expect(data.cursor).toBeGreaterThan(0)
    expect(Array.isArray(data.accounts)).toBe(true)
    expect(Array.isArray(data.transactions)).toBe(true)
    // Should not return categories or range
    expect(data.categories).toBeUndefined()
    expect(data.range).toBeUndefined()
  })

  test('delta load returns isDelta=true when since param provided', async () => {
    // First get a cursor
    const fullResponse = await fetch(`${BASE_URL}/api/bootstrap`)
    const fullData = await fullResponse.json()
    const cursor = fullData.cursor

    // Now fetch delta
    const deltaResponse = await fetch(`${BASE_URL}/api/bootstrap?since=${cursor}`)
    expect(deltaResponse.ok).toBe(true)

    const deltaData = await deltaResponse.json()

    expect(deltaData.isDelta).toBe(true)
    expect(deltaData.cursor).toBeGreaterThanOrEqual(cursor)
    // Delta may return empty transactions if nothing changed
    expect(Array.isArray(deltaData.transactions)).toBe(true)
  })

  test('delta returns only transactions with updatedAt > since', async () => {
    // Get a cursor from 1 year ago (should include most transactions)
    const oldCursor = Date.now() - 365 * 24 * 60 * 60 * 1000

    const deltaResponse = await fetch(`${BASE_URL}/api/bootstrap?since=${oldCursor}`)
    expect(deltaResponse.ok).toBe(true)

    const deltaData = await deltaResponse.json()

    // Verify all returned transactions have updatedAt > oldCursor
    for (const tx of deltaData.transactions) {
      const updatedAt = new Date(tx.updatedAt).getTime()
      expect(updatedAt).toBeGreaterThan(oldCursor)
    }
  })

  test('delta with future cursor returns empty transactions', async () => {
    // Use a cursor in the future
    const futureCursor = Date.now() + 365 * 24 * 60 * 60 * 1000

    const deltaResponse = await fetch(`${BASE_URL}/api/bootstrap?since=${futureCursor}`)
    expect(deltaResponse.ok).toBe(true)

    const deltaData = await deltaResponse.json()

    expect(deltaData.isDelta).toBe(true)
    expect(deltaData.transactions.length).toBe(0)
  })
})
