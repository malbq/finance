import { PrismaClient } from '@prisma-app/client'

interface CategorySpendingData {
  category: string
  month_year: string
  month_date: string
  total_spending: number
  moving_avg_6_months: number | null
  months_in_window: number
  projected_6_month_spending: number | null
  projected_annual_spending: number | null
}

export async function getCategorySpendingMovingAverages(
  prisma: PrismaClient,
  options: {
    limit?: number
    category?: string
    onlyWithMovingAverage?: boolean
  } = {}
): Promise<CategorySpendingData[]> {
  const { limit = 50, category, onlyWithMovingAverage = false } = options

  let whereClause = ''
  if (category) {
    whereClause += `WHERE category = '${category}'`
  }
  if (onlyWithMovingAverage) {
    whereClause += whereClause ? ' AND ' : 'WHERE '
    whereClause += 'moving_avg_6_months IS NOT NULL'
  }

  const query = `
    SELECT * FROM category_spending_moving_average 
    ${whereClause}
    ORDER BY category, month_date DESC
    LIMIT ${limit}
  `

  return prisma.$queryRawUnsafe(query) as Promise<CategorySpendingData[]>
}

export async function getLatestProjectedSpending(
  prisma: PrismaClient
): Promise<Array<{ category: string; projected_annual_spending: number }>> {
  const query = `
    WITH latest_projections AS (
      SELECT 
        category,
        projected_annual_spending,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY month_date DESC) as rn
      FROM category_spending_moving_average 
      WHERE projected_annual_spending IS NOT NULL
    )
    SELECT category, projected_annual_spending
    FROM latest_projections 
    WHERE rn = 1
    ORDER BY projected_annual_spending DESC
  `

  return prisma.$queryRawUnsafe(query) as Promise<
    Array<{ category: string; projected_annual_spending: number }>
  >
}

export async function getCategoryTrends(
  prisma: PrismaClient,
  category: string
): Promise<CategorySpendingData[]> {
  const query = `
    SELECT * FROM category_spending_moving_average 
    WHERE category = '${category}'
    ORDER BY month_date DESC
    LIMIT 12
  `

  return prisma.$queryRawUnsafe(query) as Promise<CategorySpendingData[]>
}

export async function getTopSpendingCategories(
  prisma: PrismaClient,
  months: number = 6
): Promise<Array<{ category: string; total_spending: number }>> {
  const query = `
    SELECT 
      category,
      SUM(total_spending) as total_spending
    FROM category_spending_moving_average 
    WHERE month_date >= date('now', '-${months} months')
    GROUP BY category
    ORDER BY total_spending DESC
    LIMIT 20
  `

  return prisma.$queryRawUnsafe(query) as Promise<
    Array<{ category: string; total_spending: number }>
  >
}
