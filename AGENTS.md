Runtime: use Bun; commands like `bun test`, `bunx drizzle-kit`.
Frontend: React v19.
Database: Drizzle + SQLite at `./db/finance.db`.
UI: dark theme only.
Types: never use `any` to fix type errors.
Never edit migrations manually. Use `bun run db:generate` to generate new migrations.
Never alter database manually. Always use Drizzle's migration system.
Client is local-first:
  - Tanstack DB backed by Tanstack Query
  - Optimistic UI
  - Debounced persistence
  - No “saving” indicator.
