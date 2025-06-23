export function formatCurrency(amount: any): string {
  if (amount === null || amount === undefined) return 'R$ 0,00'
  const value =
    typeof amount.toNumber === 'function'
      ? amount.toNumber()
      : parseFloat(amount.toString())
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(isNaN(value) ? 0 : value)
}
