/**
 * formatPrice - Format number as currency (USD).
 * @param price - Price in cents or dollars (will be formatted as USD)
 * @returns Formatted string, e.g., "$99.99"
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * formatDate - Format Date object to readable string.
 * @param date - Date object or ISO string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted string, e.g., "May 11, 2026"
 */
export const formatDate = (date: Date | string, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * formatDateTime - Format Date object to readable datetime string.
 * @param date - Date object or ISO string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted string, e.g., "May 11, 2026, 3:30 PM"
 */
export const formatDateTime = (date: Date | string, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};
