import { writeFileSync } from 'fs'
import { join } from 'path'
import { createDatabase } from '../api/db/drizzle'
import { categories, type Category } from '../api/db/schema'

const db = createDatabase()

try {
  const categoryResults = (await db.select().from(categories as any)) as Category[]

  const categoryIds = categoryResults.map((cat) => `'${cat.id}'`).join(' | ')

  const categoryNames = categoryResults.map((cat) => `'${cat.descriptionTranslated}'`).join(' | ')

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
${categoryResults.map((cat) => `  '${cat.id}': '${cat.descriptionTranslated}'`).join(',\n')}
} as const
`

  const filePath = join(process.cwd(), 'app/domain/transactions/entities/Categories.ts')
  writeFileSync(filePath, content, 'utf8')

  console.log(`✅ Generated ${categoryResults.length} category types in Categories.ts`)
} catch (error) {
  console.error('❌ Error generating categories:', error)
  process.exit(1)
}
