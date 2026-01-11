import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { Category } from '../../domain/Categories'
import { categories } from '../db/schema'

export class CategoryService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async findById(id: string): Promise<Category | null> {
    const result = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1)

    if (result.length === 0 || !result[0]) return null

    return this.mapToEntity(result[0])
  }

  async findAll(): Promise<Category[]> {
    const result = await this.db
      .select()
      .from(categories)
      .orderBy(categories.parentId, categories.description)

    return result.map(this.mapToEntity)
  }

  private mapToEntity = (category: {
    id: string
    description: string
    descriptionTranslated: string
    parentId: string | null
    parentDescription: string | null
  }): Category => {
    return {
      id: category.id,
      description: category.description,
      descriptionTranslated: category.descriptionTranslated,
      parentId: category.parentId ?? undefined,
      parentDescription: category.parentDescription ?? undefined,
    }
  }
}
