import { PrismaClient } from '@prisma-app/client'
import type { Category } from '../entities/Categories'

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    })

    if (!category) return null

    return this.mapPrismaToEntity(category)
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { description: 'asc' }],
    })

    return categories.map(this.mapPrismaToEntity)
  }

  private mapPrismaToEntity = (category: {
    id: string
    description: string
    descriptionTranslated: string
    parentId: string | null
    parentDescription: string | null
    createdAt: Date
    updatedAt: Date
  }): Category => {
    return {
      id: category.id,
      description: category.description,
      descriptionTranslated: category.descriptionTranslated,
      parentId: category.parentId ?? undefined,
      parentDescription: category.parentDescription ?? undefined,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }
  }
}
