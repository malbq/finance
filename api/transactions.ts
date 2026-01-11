import { drizzle } from 'drizzle-orm/bun-sqlite'
import { GetTransactionsData } from './lib/GetTransactionsData'
import { UpdateTransactionCategory } from './lib/UpdateTransactionCategory'

export function createTransactionsHandler(db: ReturnType<typeof drizzle>) {
  return {
    async GET() {
      try {
        const useCase = new GetTransactionsData(db)
        const data = await useCase.execute()
        return Response.json(data)
      } catch (error) {
        console.error('Transactions API error:', error)
        return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 })
      }
    },
    async POST(req: Request) {
      try {
        const body = await req.json()
        const { transactionId, categoryId } = body

        if (!transactionId || !categoryId) {
          return Response.json(
            { error: 'Invalid parameters: transactionId and categoryId are required' },
            { status: 400 }
          )
        }

        const useCase = new UpdateTransactionCategory(db)
        const result = await useCase.execute(transactionId, categoryId)

        if (result.success) {
          return Response.json({ success: true })
        } else {
          return Response.json(
            { error: result.error || 'Failed to update category' },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error('Error updating transaction category:', error)
        return Response.json({ error: 'Failed to update category' }, { status: 500 })
      }
    },
  }
}
