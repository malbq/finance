import { PrismaClient } from '@prisma/client'
import {
  PluggyDataMapper,
  type PluggyCategory,
} from '../mappers/PluggyDataMapper'
import { PluggyClient } from './PluggyClient'

export class CategorySyncService {
  constructor(private prisma: PrismaClient, private apiKey: string) {}

  async syncCategories(): Promise<void> {
    try {
      const response = await PluggyClient.fetchData<PluggyCategory>(
        this.apiKey,
        '/categories'
      )

      for (const category of response.results) {
        try {
          await this.syncSingleCategory(category)
        } catch (error) {
          console.error(`Failed to sync category ${category.id}:`, error)
          throw error
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      throw error
    }
  }

  private async syncSingleCategory(category: PluggyCategory): Promise<void> {
    const categoryData = PluggyDataMapper.mapCategoryToDatabase(category)

    await this.prisma.category.upsert({
      where: { id: category.id },
      update: categoryData,
      create: categoryData,
    })
  }
}
