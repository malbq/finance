DROP VIEW IF EXISTS category_spending_moving_average;
CREATE VIEW category_spending_moving_average AS
WITH months_range AS (
  SELECT 1 as month_offset, date('now', '-1 month', 'start of month') as month_date
  UNION ALL SELECT 2, date('now', '-2 months', 'start of month')
  UNION ALL SELECT 3, date('now', '-3 months', 'start of month') 
  UNION ALL SELECT 4, date('now', '-4 months', 'start of month')
  UNION ALL SELECT 5, date('now', '-5 months', 'start of month')
  UNION ALL SELECT 6, date('now', '-6 months', 'start of month')
),
actual_spending AS (
  SELECT 
    date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01') as month_date,
    SUM(ABS(t."amount")) as total_spending
  FROM "Transaction" t
  JOIN "Account" a ON t."accountId" = a."id"
  WHERE t."type" = 'DEBIT' 
    AND t."categoryId" NOT IN ('03000000', '05100000', '04000000', '12')
  GROUP BY 
    date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01')
),
monthly_spending AS (
  SELECT 
    m.month_offset,
    m.month_date,
    COALESCE(s.total_spending, 0) as spending_amount
  FROM months_range m
  LEFT JOIN actual_spending s ON m.month_date = s.month_date
)
SELECT 
  'Total' as category,
  ROUND(
    SUM(spending_amount * (7 - month_offset)) / 21.0,
    2
  ) as moving_avg_6_months
FROM monthly_spending;

SELECT 
  date('now', '-3 hours', '-1 month', 'start of month') as month_1,
  date('now', '-3 hours', '-2 months', 'start of month') as month_2,
  date('now', '-3 hours', '-3 months', 'start of month') as month_3,
  date('now', '-3 hours', '-4 months', 'start of month') as month_4,
  date('now', '-3 hours', '-5 months', 'start of month') as month_5,
  date('now', '-3 hours', '-6 months', 'start of month') as month_6;

SELECT * FROM (
  SELECT 
    COALESCE(t."category", 'Other') as category,
    date(strftime('%Y-%m', datetime((t."date" / 1000) - 10800, 'unixepoch')) || '-01') as month_date,
    SUM(ABS(t."amount")) as amount
  FROM "Transaction" t
  JOIN "Account" a ON t."accountId" = a."id"
  WHERE t."type" = 'DEBIT' 
    AND t."categoryId" NOT IN ('03000000', '05100000', '04000000', '99999999')
    AND date(strftime('%Y-%m', datetime((t."date" / 1000) - 10800, 'unixepoch')) || '-01') < date('now', '-3 hours', 'start of month')
  GROUP BY 
    COALESCE(t."category", 'Other'),
    date(strftime('%Y-%m', datetime((t."date" / 1000) - 10800, 'unixepoch')) || '-01')
) ORDER BY category, month_date DESC; 