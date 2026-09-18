/**
 * Utility functions for Indonesian Rupiah (IDR) and global currency formatting.
 */

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currency === 'IDR') {
    // Format Indonesian Rupiah without decimals for integers
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
    return `${isNegative ? '-' : ''}Rp ${formatted}`;
  }

  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: string = 'IDR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (currency === 'IDR') {
    if (abs >= 1_000_000_000) {
      return `${isNegative ? '-' : ''}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
    }
    if (abs >= 1_000_000) {
      return `${isNegative ? '-' : ''}${(abs / 1_000_000).toFixed(1).replace('.0', '')} jt`;
    }
    if (abs >= 1_000) {
      return `${isNegative ? '-' : ''}${(abs / 1_000).toFixed(0)} rb`;
    }
    return `${isNegative ? '-' : ''}${abs}`;
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Extracts raw number from user input string (e.g. "Rp 1.500.000" -> 1500000)
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Formats user typing into thousands separated string (e.g. 1500000 -> "1.500.000")
 */
export function formatCurrencyInputValue(value: number | string): string {
  const num = parseCurrencyInput(value);
  if (!num && num !== 0) return '';
  if (num === 0) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}
