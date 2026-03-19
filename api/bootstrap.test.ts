import { describe, expect, test } from "bun:test";

/**
 * Integration tests for the bootstrap API endpoint.
 * Verifies full load vs delta behavior.
 *
 * IMPORTANT: These tests require the dev server to be running.
 * Start it with: bun run dev
 *
 * Run these tests with: bun test api/bootstrap.test.ts
 */
describe("Bootstrap API", () => {
  const BASE_URL = "http://localhost:7777";

  test("full load returns isDelta=false and all transactions in window", async () => {
    const response = await fetch(`${BASE_URL}/api/bootstrap`);
    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data.isDelta).toBe(false);
    expect(data.cursor).toBeGreaterThan(0);
    expect(Array.isArray(data.accounts)).toBe(true);
    expect(Array.isArray(data.transactions)).toBe(true);
    // Categories should always be present
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThan(0);
    // Verify category shape
    const cat = data.categories[0];
    expect(typeof cat.id).toBe("string");
    expect(typeof cat.description).toBe("string");
    expect(typeof cat.descriptionTranslated).toBe("string");
    expect(typeof cat.excludedFromTx).toBe("boolean");
    expect(typeof cat.excludedFromSpending).toBe("boolean");
    // Should not return range
    expect(data.range).toBeUndefined();
  });

  test("delta load returns isDelta=true when since param provided", async () => {
    // First get a cursor
    const fullResponse = await fetch(`${BASE_URL}/api/bootstrap`);
    const fullData = await fullResponse.json();
    const cursor = fullData.cursor;

    // Now fetch delta
    const deltaResponse = await fetch(`${BASE_URL}/api/bootstrap?since=${cursor}`);
    expect(deltaResponse.ok).toBe(true);

    const deltaData = await deltaResponse.json();

    expect(deltaData.isDelta).toBe(true);
    expect(deltaData.cursor).toBeGreaterThanOrEqual(cursor);
    // Delta may return empty transactions if nothing changed
    expect(Array.isArray(deltaData.transactions)).toBe(true);
    // Categories are always sent in full, even on delta
    expect(Array.isArray(deltaData.categories)).toBe(true);
    expect(deltaData.categories.length).toBeGreaterThan(0);
  });

  test("delta returns only transactions with updatedAt > since", async () => {
    // Get a cursor from 1 year ago (should include most transactions)
    const oldCursor = Date.now() - 365 * 24 * 60 * 60 * 1000;

    const deltaResponse = await fetch(`${BASE_URL}/api/bootstrap?since=${oldCursor}`);
    expect(deltaResponse.ok).toBe(true);

    const deltaData = await deltaResponse.json();

    // Verify all returned transactions have updatedAt > oldCursor
    for (const tx of deltaData.transactions) {
      const updatedAt = new Date(tx.updatedAt).getTime();
      expect(updatedAt).toBeGreaterThan(oldCursor);
    }
  });

  test("delta with future cursor returns empty transactions", async () => {
    // Use a cursor in the future
    const futureCursor = Date.now() + 365 * 24 * 60 * 60 * 1000;

    const deltaResponse = await fetch(`${BASE_URL}/api/bootstrap?since=${futureCursor}`);
    expect(deltaResponse.ok).toBe(true);

    const deltaData = await deltaResponse.json();

    expect(deltaData.isDelta).toBe(true);
    expect(deltaData.transactions.length).toBe(0);
  });
});
