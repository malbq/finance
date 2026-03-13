import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { category as categoryTable } from '../db/schema'
import { PluggyClient } from './PluggyClient'
import { PluggyDataMapper, type PluggyCategory } from './PluggyDataMapper'

export class CategorySyncService {
  constructor(private db: ReturnType<typeof drizzle>, private apiKey: string) {}

  async syncCategories(): Promise<void> {
    try {
      const response = await PluggyClient.fetchData<PluggyCategory>(this.apiKey, '/categories')

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

    const existingCategory = await this.db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, category.id))
      .limit(1)

    if (existingCategory.length > 0) {
      await this.db.update(categoryTable).set(categoryData).where(eq(categoryTable.id, category.id))
    } else {
      await this.db.insert(categoryTable).values(categoryData)
    }
  }
}
