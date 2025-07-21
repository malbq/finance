import { PrismaClient } from '@prisma-app/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

try {
  // Fetch all categories from the database
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      descriptionTranslated: true,
    },
  })

  type CategoryData = { id: string; descriptionTranslated: string }

  // Generate union type from category IDs
  const categoryIds = categories
    .map((cat: CategoryData) => `'${cat.id}'`)
    .join(' | ')

  // Generate union type from translated descriptions
  const categoryNames = categories
    .map((cat: CategoryData) => `'${cat.descriptionTranslated}'`)
    .join(' | ')

  // Create the TypeScript content
  const content = `// This file is auto-generated. Do not edit manually.
// Run: bun run generate:categories

export interface Category {
  id: string
  description: string
  descriptionTranslated: string
  parentId?: string
  parentDescription?: string
}

export type CategoryId = ${categoryIds || "'unknown'"}

export type CategoryName = ${categoryNames || "'Outros'"}

export const CATEGORY_MAP: Record<CategoryId, CategoryName> = {
${categories
  .map((cat: CategoryData) => `  '${cat.id}': '${cat.descriptionTranslated}'`)
  .join(',\n')}
} as const
`

  // Write to Categories.ts
  const filePath = join(
    process.cwd(),
    'app/domain/transactions/entities/Categories.ts'
  )
  writeFileSync(filePath, content, 'utf8')

  console.log(
    `✅ Generated ${categories.length} category types in Categories.ts`
  )
} catch (error) {
  console.error('❌ Error generating categories:', error)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
