What we’ll change (high-level)

- Stop the UI from fetching /api/dashboard and /api/transactions.
- Add a single “bootstrap” endpoint that returns all entities needed for the last 6 months.
- Hydrate TanStack DB collections from that bootstrap payload.
- Make useDashboardData and useTransactionsData read purely from local collections (query-db-collection-backed).
- Make category updates optimistic: update local collection first, then POST to server.

---

1. Server: add a bootstrap endpoint (full refresh)
   New route

- GET /api/bootstrap
  Response payload (suggested)
- accounts: Account[] (from AccountService.findAll())
- categories: Category[] (from CategoryService.findAll())
- transactions: Transaction[] (flattened list, date-filtered to the window)
- generatedAt: number (Date.now) and range: { from: number; to: number } for debugging
  Time window
- to = Date.now()
- from = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime()
  Important server-side efficiency fix
- Today GetTransactionsData is accounts -> per-account findByAccountId() with no range filtering.
- For bootstrap we should avoid N+1 querying and instead run a single query that returns all transactions since from (including joins) and then:
  - either return them flattened
  - or group on the server (but grouping is optional since client will own “accounts with transactions” view)
    This is likely the biggest existing inefficiency and will matter a lot once bootstrap is called often.
    Where
- Add a new handler similar to api/dashboard.ts / api/transactions.ts, then wire it in server.ts.

---

2. Client: define TanStack DB collections (browser local storage)
   No client SQLite. Use browser-backed persistence supported by TanStack DB (IndexedDB/local persistence depending on the library’s recommended adapter).
   Collections

- accounts (key: id)
- categories (key: id)
- transactions (key: id)
- meta (keyed singleton, store lastBootstrapAt, rangeFrom, rangeTo)
  Indexes (at minimum)
- transactions.date (for range queries, charts)
- transactions.accountId (for account tabs)
- transactions.categoryId (for dashboard/category aggregates)
  Shape choice
- Keep entities close to today’s domain types (domain/Transaction.ts, domain/Account.ts, domain/Categories.ts) so UI changes stay minimal.

---

3. Client: hydration flow (bootstrapping local DB)
   Create a single TanStack Query query:

- useBootstrapQuery() with queryKey: ['bootstrap']
- queryFn: fetch('/api/bootstrap')
- onSuccess: upsert into the 3 collections + update meta
- This becomes the only read-fetch called by the UI during normal usage.
  Hook integration point:
- Trigger it once on app start (or route entry), and also have the existing “Sync Data” button trigger refetch/mutation that re-runs bootstrap.

---

4. Replace useDashboardData and useTransactionsData with local reads
   useTransactionsData
   Current UI expects:

- TransactionsData = { accounts: Array<Account & { transactions: Transaction[] }> }
  After local-first:
- Read accounts from local collection
- Read transactions from local collection (already within 6-month window by construction)
- Derive accountsWithTransactions on the client (group by accountId)
- Return the same TransactionsData shape so app/routes/transactions.tsx stays mostly intact
  useDashboardData
  Current dashboard uses DTO from api/lib/getDashboardData.ts:
- balanceEvolution, spendingByCategory, totals
  After local-first:
- Compute those aggregates from local collections:
  - balances: from accounts (+ investments if you decide to include them later)
  - spending-by-category: from transactions in range
  - balance evolution: from monthly buckets derived locally (or keep existing projections logic if needed server-side; but simplest is compute locally from transactions and/or projections table)
- Initially aim for “feature parity” with current UI props: app/routes/index.tsx destructures these fields directly.

---

5. Optimistic category update (single-device)
   Update flow:

- In useCategoryUpdate, immediately update the local transactions collection item:
  - set categoryId
  - also set category name if the UI needs it (today it uses CATEGORY_MAP anyway)
- Fire POST /api/transactions (or a renamed endpoint) to persist.
- On failure: rollback the local transaction to previous category fields.
  As a consequence:
- Remove invalidateQueries(['transactions']) and rely on reactive collection updates.
- This is exactly the “stop querying what’s already local” behavior you want.

---

6. Post-integration inefficiency audit (concrete checklist)
   After migration, we should be able to say:

- No UI code calls fetch('/api/dashboard') or fetch('/api/transactions').
- The only remaining UI fetches are:
  - GET /api/bootstrap (full refresh)
  - mutation POST(s) like category updates and sync triggers
    Specific things to search/remove (already located):
- app/hooks/useDashboardData.ts (remote fetch)
- app/hooks/useTransactionsData.ts (remote fetch)
- app/hooks/useSyncMutation.ts invalidating ['dashboard']/['transactions']
- app/hooks/useCategoryUpdate.ts invalidating ['transactions']
  Then second-order inefficiencies:
- Any duplicated “derive dashboard aggregates” across components: consolidate into one derived query/selector.
- Any “sync on navigation” behavior: avoid; make sync explicit or background-timer-based.
