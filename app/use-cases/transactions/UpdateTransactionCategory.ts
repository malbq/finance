import { PrismaClient } from '@prisma-app/client'
import { CategoryService } from '../../domain/transactions/services/CategoryService'
import { TransactionService } from '../../domain/transactions/services/TransactionService'

export interface UpdateCategoryRequest {
  transactionId: string
  categoryId: string
}

export interface UpdateCategoryResponse {
  success: boolean
  error?: string
}

export class UpdateTransactionCategory {
  private transactionService: TransactionService
  private categoryService: CategoryService

  constructor(private prisma: PrismaClient) {
    this.transactionService = new TransactionService(prisma)
    this.categoryService = new CategoryService(prisma)
  }

  async execute(
    transactionId: string,
    categoryId: string
  ): Promise<UpdateCategoryResponse> {
    try {
      if (!transactionId || !categoryId) {
        return {
          success: false,
          error: 'Missing required parameters: transactionId and categoryId',
        }
      }

      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        console.warn(`Category not found: ${categoryId}`)
        return {
          success: false,
          error: 'Category not found',
        }
      }

      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
      })

      if (!existingTransaction) {
        console.warn(`Transaction not found: ${transactionId}`)
        return {
          success: false,
          error: 'Transaction not found',
        }
      }

      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          categoryId: categoryId,
          category: category.descriptionTranslated,
          updatedAt: new Date(),
        },
      })

      console.info(
        `Successfully updated transaction ${transactionId} with category ${categoryId}`
      )
      return { success: true }
    } catch (error) {
      console.error(
        `Error updating transaction category for transaction ${transactionId}:`,
        error
      )
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

  async executeBatch(
    requests: UpdateCategoryRequest[]
  ): Promise<UpdateCategoryResponse[]> {
    const results: UpdateCategoryResponse[] = []

    for (const request of requests) {
      const result = await this.execute(
        request.transactionId,
        request.categoryId
      )
      results.push(result)
    }

    return results
  }
}
