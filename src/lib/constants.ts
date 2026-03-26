// ─── ReadKindled Constants ────────────────────────────────────
// Swap values here — they propagate everywhere.

/** Amazon Associates affiliate tag. Replace when Bruce confirms actual tag. */
export const AMAZON_AFFILIATE_TAG = 'readkindled-20';

/** Build an Amazon search URL for a book */
export function getAmazonLink(title: string, author: string): string {
  const q = encodeURIComponent(`${title} ${author}`);
  return `https://www.amazon.com/s?k=${q}&tag=${AMAZON_AFFILIATE_TAG}`;
}
