import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

export const createDatabase = () => {
  const sqlite = new Database(process.env.DATABASE_URL)
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec('PRAGMA busy_timeout = 5000')
  return drizzle(sqlite, { schema })
}
