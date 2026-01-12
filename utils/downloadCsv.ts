/**
 * Escapes a CSV field value (handles quotes and commas).
 */
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Converts an array of objects to CSV string.
 */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]): string {
  if (rows.length === 0) return ''

  const firstRow = rows[0]!
  const headers = columns ?? (Object.keys(firstRow) as (keyof T)[])
  const headerLine = headers.map((h) => escapeCsvField(String(h))).join(',')

  const dataLines = rows.map((row) =>
    headers.map((col) => escapeCsvField(row[col])).join(',')
  )

  return [headerLine, ...dataLines].join('\n')
}

/**
 * Downloads a CSV string as a file.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
