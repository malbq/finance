import { drizzle } from 'drizzle-orm/bun-sqlite'
import { SyncOrchestrator } from './lib/SyncOrchestrator'

export function createSyncHandler(db: ReturnType<typeof drizzle>) {
  return {
    async POST() {
      try {
        const orchestrator = new SyncOrchestrator(db)
        const result = await orchestrator.executeFull()
        return Response.json(result)
      } catch (error) {
        console.error('Sync API error:', error)
        return Response.json(
          {
            error: 'Sync failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    },
  }
}
