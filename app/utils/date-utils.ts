export function applyTimezoneOffset(date: Date): Date {
  const offsetHours = -3
  const offsetMs = offsetHours * 60 * 60 * 1000
  return new Date(date.getTime() + offsetMs)
}

export function getMonthKeyWithOffset(date: Date): string {
  const adjustedDate = applyTimezoneOffset(date)
  const monthStart = new Date(
    adjustedDate.getFullYear(),
    adjustedDate.getMonth(),
    1
  )
  return monthStart.toISOString().slice(0, 7)
}

export function getMonthBoundariesWithOffset(year: number, month: number) {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  const offsetHours = -3
  const offsetMs = offsetHours * 60 * 60 * 1000

  return {
    start: new Date(monthStart.getTime() + offsetMs),
    end: new Date(monthEnd.getTime() + offsetMs),
  }
}
