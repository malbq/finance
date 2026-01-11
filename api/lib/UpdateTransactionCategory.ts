import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { categories, transactions } from '../db/schema'
import { CategoryService } from './CategoryService'
import { TransactionService } from './TransactionService'

interface UpdateCategoryRequest {
  transactionId: string
  categoryId: string
}

interface UpdateCategoryResponse {
  success: boolean
  error?: string
}

export class UpdateTransactionCategory {
  private transactionService: TransactionService
  private categoryService: CategoryService

  constructor(private db: ReturnType<typeof drizzle>) {
    this.transactionService = new TransactionService(db)
    this.categoryService = new CategoryService(db)
  }

  async execute(transactionId: string, categoryId: string): Promise<UpdateCategoryResponse> {
    try {
      if (!transactionId || !categoryId) {
        return {
          success: false,
          error: 'Missing required parameters: transactionId and categoryId',
        }
      }

      const categoryResult = await this.db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1)

      if (categoryResult.length === 0) {
        console.warn(`Category not found: ${categoryId}`)
        return {
          success: false,
          error: 'Category not found',
        }
      }

      const category = categoryResult[0]
      if (!category) {
        console.warn(`Category not found: ${categoryId}`)
        return {
          success: false,
          error: 'Category not found',
        }
      }

      const transactionResult = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1)

      if (transactionResult.length === 0) {
        console.warn(`Transaction not found: ${transactionId}`)
        return {
          success: false,
          error: 'Transaction not found',
        }
      }

      await this.db
        .update(transactions)
        .set({
          categoryId: categoryId,
          category: category.descriptionTranslated,
          updatedAt: Date.now(),
        })
        .where(eq(transactions.id, transactionId))

      console.info(`Successfully updated transaction ${transactionId} with category ${categoryId}`)
      return { success: true }
    } catch (error) {
      console.error(`Error updating transaction category for transaction ${transactionId}:`, error)
      if (error instanceof Error) {
        console.error('Update category error details:', {
          transactionId,
          categoryId,
          message: error.message,
          stack: error.stack,
        })
      }
      return {
        success: false,
        error: 'Failed to update category',
      }
    }
  }

  async executeBatch(requests: UpdateCategoryRequest[]): Promise<UpdateCategoryResponse[]> {
    const results: UpdateCategoryResponse[] = []

    for (const request of requests) {
      const result = await this.execute(request.transactionId, request.categoryId)
      results.push(result)
    }

    return results
  }
}
