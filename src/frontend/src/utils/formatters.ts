/**
 * Formats a number as signed USD currency with comma separators and 2 decimal places.
 * Returns format like: +$1,234.56 or -$1,234.56 or $0.00
 */
export function formatSignedUSD(value: number): string {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (value > 0) {
    return `+$${formatted}`;
  } else if (value < 0) {
    return `-$${formatted}`;
  } else {
    return `$${formatted}`;
  }
}
