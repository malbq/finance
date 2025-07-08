import { SyncOrchestrator } from '../domain/sync/services/SyncOrchestrator'
import { prisma } from '../lib/db.server'

export async function action({ request }: { request: Request }) {
  if (request.method === 'POST') {
    const syncOrchestrator = new SyncOrchestrator(prisma)

    try {
      console.info('Starting full sync operation')

      const result = await syncOrchestrator.executeFull()

      if (result.success) {
        console.info('Sync operation completed successfully')
        return Response.json({
          success: true,
          message: result.message,
          details: result.details,
        })
      } else {
        console.error('Sync operation failed', {
          message: result.message,
          details: result.details,
          errors: result.errors,
        })
        return Response.json(
          {
            success: false,
            message: result.message || 'Synchronization failed',
            details: result.details,
            errors: result.errors,
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Unexpected sync error:', error)
      if (error instanceof Error) {
        console.error('Sync error details:', {
          message: error.message,
          stack: error.stack,
        })
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      return Response.json(
        {
          success: false,
          message: 'Synchronization failed unexpectedly',
          error: errorMessage,
        },
        { status: 500 }
      )
    }
  }

  console.warn(`Invalid method for sync API: ${request.method}`)
  return Response.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
