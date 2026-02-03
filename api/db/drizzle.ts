import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

export const createDatabase = () => {
  const sqlite = new Database(process.env.DATABASE_URL)
  sqlite.run('PRAGMA journal_mode = WAL')
  sqlite.run('PRAGMA busy_timeout = 5000')
  return drizzle({ client: sqlite, schema })
}
