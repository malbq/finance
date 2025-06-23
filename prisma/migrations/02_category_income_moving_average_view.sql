DROP VIEW IF EXISTS category_income_moving_average;
CREATE VIEW category_income_moving_average AS
WITH months_range AS (
  SELECT 1 as month_offset, date('now', '-1 month', 'start of month') as month_date
  UNION ALL SELECT 2, date('now', '-2 months', 'start of month')
  UNION ALL SELECT 3, date('now', '-3 months', 'start of month') 
  UNION ALL SELECT 4, date('now', '-4 months', 'start of month')
  UNION ALL SELECT 5, date('now', '-5 months', 'start of month')
  UNION ALL SELECT 6, date('now', '-6 months', 'start of month')
),
all_categories AS (
  SELECT DISTINCT COALESCE(t."category", 'Other') as category
  FROM "Transaction" t
  JOIN "Account" a ON t."accountId" = a."id"
  WHERE a."type" = 'BANK' 
    AND t."type" = 'CREDIT' 
    AND t."categoryId" = '01010000'
),
actual_income AS (
  SELECT 
    COALESCE(t."category", 'Other') as category,
    date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01') as month_date,
    SUM(ABS(t."amount")) as income_amount
  FROM "Transaction" t
  JOIN "Account" a ON t."accountId" = a."id"
  WHERE a."type" = 'BANK' 
    AND t."type" = 'CREDIT' 
    AND t."categoryId" = '01010000'
  GROUP BY 
    COALESCE(t."category", 'Other'),
    date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01')
),
category_month_matrix AS (
  SELECT 
    c.category,
    m.month_offset,
    m.month_date,
    COALESCE(i.income_amount, 0) as income_amount
  FROM all_categories c
  CROSS JOIN months_range m
  LEFT JOIN actual_income i ON c.category = i.category AND m.month_date = i.month_date
),
weighted_calculation AS (
  SELECT 
    category,
    SUM(income_amount * (7 - month_offset)) as weighted_sum,
    SUM(7 - month_offset) as total_weights
  FROM category_month_matrix
  GROUP BY category
)
SELECT 
  category,
  ROUND(weighted_sum / total_weights, 2) as moving_avg_6_months
FROM weighted_calculation
WHERE total_weights = 21
ORDER BY category; 