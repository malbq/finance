import type { Config } from 'drizzle-kit'

export default {
  schema: './api/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'db/finance.db',
  },
} satisfies Config
