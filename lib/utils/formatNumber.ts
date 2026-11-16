/**
 * Format number to K/M notation
 * @param num - Number to format
 * @returns Formatted string (e.g., 6281 -> "6.3K", 1200000 -> "1.2M")
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format number with hover tooltip showing original value
 * @param num - Number to format
 * @returns Object with formatted string and original value
 */
export function formatNumberWithTooltip(num: number) {
  const formatted = formatNumber(num);
  const original = num.toLocaleString();
  const hasTooltip = formatted !== num.toString();
  
  return {
    formatted,
    original,
    hasTooltip
  };
}