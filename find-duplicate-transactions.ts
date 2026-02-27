import { Database } from 'bun:sqlite'
import { join } from 'node:path'

const dbPath = join(process.cwd(), 'db', 'finance.db')
const db = new Database(dbPath)

type TxRow = {
  id: string
  accountId: string
  description: string
  amount: number
  date: number
  updatedAt: number
}

const accountId = process.argv[2]
if (!accountId) {
  console.error('Please provide an accountId as the first argument.')
  process.exit(1)
}

const rows = db
  .query(
    `SELECT id, accountId, description, amount, date, updatedAt
     FROM "Transaction"
     WHERE accountId = ?1
     ORDER BY date ASC`,
  )
  .all(accountId) as TxRow[]

const keyFor = (row: TxRow) => {
  return `${row.accountId}::${row.description.replace(/\s+/g, ' ').trim().toLowerCase()}::${row.amount}::${row.date}`
}

const buckets = new Map<string, TxRow[]>()
for (const row of rows) {
  const key = keyFor(row)
  const bucket = buckets.get(key)
  if (bucket) {
    bucket.push(row)
  } else {
    buckets.set(key, [row])
  }
}

const duplicates = [...buckets.values()].filter((group) => group.length > 1)

if (duplicates.length === 0) {
  console.log('No duplicates found.')
  process.exit(0)
}

console.log(`Found ${duplicates.length} duplicate groups.`)

for (const group of duplicates) {
  const first = group[0]!
  const { accountId, description, amount, date } = first
  console.log(
    `Acc: ${accountId} | ${new Date(date).toISOString()} | ${description} | ${amount} | Ids: ${group.map((row) => row.id).join(', ')}`
  )
}

// DRY execution for safety - review output before commenting the line below to delete duplicates
process.exit(0)

const deleteStmt = db.query(`DELETE FROM "Transaction" WHERE id = ?`)
const paymentDataByTxStmt = db.query(`SELECT id FROM "PaymentData" WHERE transactionId = ?`)
const creditCardMetadataByTxStmt = db.query(
  `SELECT id FROM "CreditCardMetadata" WHERE transactionId = ?`
)
const acquirerDataByTxStmt = db.query(`SELECT id FROM "AcquirerData" WHERE transactionId = ?`)
const merchantByTxStmt = db.query(`SELECT id FROM "Merchant" WHERE transactionId = ?`)

const findRelatedIds = (transactionId: string) => {
  return {
    paymentData: paymentDataByTxStmt.all(transactionId) as Array<{ id: string }>,
    creditCardMetadata: creditCardMetadataByTxStmt.all(transactionId) as Array<{ id: string }>,
    acquirerData: acquirerDataByTxStmt.all(transactionId) as Array<{ id: string }>,
    merchant: merchantByTxStmt.all(transactionId) as Array<{ id: string }>
  }
}

let deletedCount = 0
const failedDeletes: Array<{ id: string; error: unknown }> = []

for (const group of duplicates) {
  const toDelete = group.reduce((current, row) =>
    row.updatedAt > current.updatedAt ? row : current
  )

  try {
    deleteStmt.run(toDelete.id)
    deletedCount++
  } catch (error) {
    failedDeletes.push({ id: toDelete.id, error })
  }
}

console.log(`Deleted ${deletedCount} duplicate rows (greatest updatedAt in each group).`)

if (failedDeletes.length > 0) {
  console.log(`Failed to delete ${failedDeletes.length} rows due to FK constraints.`)
  for (const failure of failedDeletes) {
    console.log('\n---')
    console.log(`TransactionId: ${failure.id}`)
    console.log(`Error: ${String(failure.error)}`)
    const related = findRelatedIds(failure.id)
    if (
      related.paymentData.length ||
      related.creditCardMetadata.length ||
      related.acquirerData.length ||
      related.merchant.length
    ) {
      if (related.paymentData.length) {
        console.log(`PaymentData: ${related.paymentData.map((row) => row.id).join(', ')}`)
      }
      if (related.creditCardMetadata.length) {
        console.log(
          `CreditCardMetadata: ${related.creditCardMetadata.map((row) => row.id).join(', ')}`
        )
      }
      if (related.acquirerData.length) {
        console.log(`AcquirerData: ${related.acquirerData.map((row) => row.id).join(', ')}`)
      }
      if (related.merchant.length) {
        console.log(`Merchant: ${related.merchant.map((row) => row.id).join(', ')}`)
      }
    } else {
      console.log('No direct related rows found in known tables.')
    }
  }
}
