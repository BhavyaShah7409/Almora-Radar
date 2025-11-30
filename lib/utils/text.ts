/**
 * Count words in a text string
 * Handles both English and Hindi text with Unicode support
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Remove extra whitespace and trim
  const cleaned = text.trim().replace(/\s+/g, ' ');

  if (cleaned.length === 0) {
    return 0;
  }

  // Split by whitespace and filter empty strings
  // This works for both English and Hindi (Devanagari script)
  const words = cleaned.split(/\s+/).filter((word) => word.length > 0);

  return words.length;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

/**
 * Extract first N words from text
 */
export function extractWords(text: string, count: number): string {
  const words = text.trim().split(/\s+/);
  return words.slice(0, count).join(' ');
}

/**
 * Check if text is primarily Hindi (Devanagari script)
 */
export function isHindiText(text: string): boolean {
  // Devanagari Unicode range: U+0900 to U+097F
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

/**
 * Highlight matching text in search results
 */
export function highlightText(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
