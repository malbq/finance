DROP VIEW IF EXISTS MovingAverageProjections;
CREATE VIEW MovingAverageProjections AS WITH
months_range AS (
  SELECT 1 as month_offset, date('now', '-1 month', 'start of month') as month_date
  UNION ALL SELECT 2, date('now', '-2 months', 'start of month')
  UNION ALL SELECT 3, date('now', '-3 months', 'start of month')
  UNION ALL SELECT 4, date('now', '-4 months', 'start of month')
  UNION ALL SELECT 5, date('now', '-5 months', 'start of month')
  UNION ALL SELECT 6, date('now', '-6 months', 'start of month')
),
spending_monthly AS (
  SELECT date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01') as month_date,
    SUM(ABS(t."amount")) as total
  FROM "Transaction" t JOIN "Account" a ON t."accountId" = a."id"
  WHERE t."type" = 'DEBIT' AND t."categoryId" NOT IN (
    '01000000', '01010000', '01020000', '01030000', '01040000', '01050000', '03000000',
    '03010000', '03020000', '03030000', '03040000', '03050000', '03060000', '03070000',
    '04000000', '05100000', '12'
  )
  GROUP BY month_date
),
spending_average AS (
  SELECT ROUND(
      SUM(spending_monthly.total * (7 - months_range.month_offset)) / 21.0,
      2
    ) as value
  FROM spending_monthly JOIN months_range ON spending_monthly.month_date = months_range.month_date
),
income_monthly AS (
  SELECT 
    date(strftime('%Y-%m', datetime(t."date" / 1000, 'unixepoch', '-3 hours')) || '-01') as month_date,
    SUM(ABS(t."amount")) as total
  FROM "Transaction" t JOIN "Account" a ON t."accountId" = a."id"
  WHERE a."type" = 'BANK' AND t."type" = 'CREDIT' AND t."categoryId" = '01010000'
  GROUP BY month_date
),
income_average AS (
  SELECT ROUND(
      SUM(income_monthly.total * (7 - months_range.month_offset)) / 21.0,
      2
    ) as value
  FROM income_monthly JOIN months_range ON income_monthly.month_date = months_range.month_date
)
SELECT 'Spending' as category, spending_average.value as value
FROM spending_average
UNION ALL
SELECT 'Income' as category, income_average.value as value
FROM income_average;
