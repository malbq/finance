export function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined) return '0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
