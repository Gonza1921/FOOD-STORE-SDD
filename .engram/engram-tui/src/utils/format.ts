/**
 * Formatting utilities for TUI
 */

import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'PPP p', { locale: es });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date as relative (e.g., "5 minutes ago")
 */
export function formatDateRelative(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(d, { locale: es, addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

/**
 * Truncate string to max length
 */
export function truncateString(str: string, maxLength: number = 80): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Pad string to fixed width
 */
export function padString(
  str: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'left'
): string {
  if (str.length >= width) {
    return truncateString(str, width);
  }

  const padding = width - str.length;

  switch (align) {
    case 'right':
      return ' '.repeat(padding) + str;
    case 'center':
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
    case 'left':
    default:
      return str + ' '.repeat(padding);
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('es-ES');
}

/**
 * Format percentage
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return Math.round((value / total) * 100) + '%';
}

/**
 * Create progress bar
 */
export function createProgressBar(
  current: number,
  total: number,
  width: number = 20
): string {
  const percentage = current / total;
  const filled = Math.round(width * percentage);
  const empty = width - filled;

  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percentage * 100)}%`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case to Title Case
 */
export function snakeCaseToTitle(str: string): string {
  return str
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Highlight search term in text
 */
export function highlightTerm(text: string, term: string): string {
  if (!term) return text;

  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '[HIGHLIGHT]$1[/HIGHLIGHT]');
}

/**
 * Wrap text to width
 */
export function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
