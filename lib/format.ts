export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `¥${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `¥${(amount / 1000).toFixed(2)}K`
  }
  return `¥${amount.toFixed(0)}`
}
