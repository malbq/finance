export function formatKilo(value: number): string {
  return value === 0
    ? ''
    : Math.abs(value) > 1000
    ? `${(value / 1000).toFixed(1)}k`
    : `${Math.round(value)}`
}
