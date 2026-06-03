// src/shared/utils/formatCurrency.ts

export function fmt(amount: number, currencyCode = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}