import type { Config } from 'drizzle-kit'

export default {
  schema: './app/lib/db/drizzle-schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'db/finance.db',
  },
} satisfies Config
