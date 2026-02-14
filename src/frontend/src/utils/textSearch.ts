/**
 * Normalizes text for case-insensitive comparison by converting to lowercase and trimming whitespace.
 * @param text - The text to normalize
 * @returns Normalized text (lowercase, trimmed)
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Checks if a text contains a search query (case-insensitive).
 * @param text - The text to search in
 * @param query - The search query
 * @returns True if the text contains the query (case-insensitive)
 */
export function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return normalizeText(text).includes(normalizeText(query));
}
