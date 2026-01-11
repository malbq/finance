import { drizzle } from 'drizzle-orm/bun-sqlite'
import { getDashboardData } from './lib/getDashboardData'

export function createDashboardHandler(db: ReturnType<typeof drizzle>) {
  return {
    async GET() {
      return await getDashboardData(db).then((data) => Response.json(data)).catch((error) => {
        console.error('[API] Dashboard API error:', error)
        return Response.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
      })
    },
  }
}
