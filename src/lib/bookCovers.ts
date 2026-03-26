/**
 * Google Books API cover fetcher with localStorage caching.
 * No API key needed (free tier: 1000 req/day).
 * Falls back to CSS gradient from covers.ts if no cover found.
 */

const CACHE_KEY = 'rk-book-covers';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CoverCache {
  [bookKey: string]: { url: string | null; ts: number };
}

function loadCache(): CoverCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: CoverCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — silent */ }
}

/**
 * Fetch a book cover URL from Google Books API.
 * Returns a high-res HTTPS thumbnail or null.
 */
export async function fetchGoogleBookCover(
  title: string,
  author: string,
): Promise<string | null> {
  const key = `${title}::${author}`.toLowerCase();
  const cache = loadCache();

  // Check cache
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.url;
  }

  try {
    const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo/imageLinks)`,
    );
    if (!res.ok) {
      cache[key] = { url: null, ts: Date.now() };
      saveCache(cache);
      return null;
    }

    const data = await res.json();
    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;

    // Prefer larger images, convert to HTTPS
    let url: string | null =
      imageLinks?.extraLarge ||
      imageLinks?.large ||
      imageLinks?.medium ||
      imageLinks?.thumbnail ||
      imageLinks?.smallThumbnail ||
      null;

    if (url) {
      // Google Books returns HTTP — force HTTPS
      url = url.replace('http://', 'https://');
      // Remove edge=curl parameter for cleaner images
      url = url.replace('&edge=curl', '');
      // Request larger zoom
      if (!url.includes('zoom=')) {
        url += '&zoom=2';
      }
    }

    cache[key] = { url, ts: Date.now() };
    saveCache(cache);
    return url;
  } catch {
    return null;
  }
}

/**
 * React hook-compatible: prefetch covers for a list of books.
 * Returns a Map of bookId → coverUrl.
 */
export async function prefetchCovers(
  books: Array<{ id: string; title: string; author: string }>,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const cache = loadCache();

  // Split into cached vs needs-fetch
  const toFetch: typeof books = [];
  for (const book of books) {
    const key = `${book.title}::${book.author}`.toLowerCase();
    const cached = cache[key];
    if (cached && Date.now() - cached.ts < CACHE_TTL && cached.url) {
      results.set(book.id, cached.url);
    } else {
      toFetch.push(book);
    }
  }

  // Batch fetch (max 5 concurrent to stay under rate limits)
  const batchSize = 5;
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    const urls = await Promise.all(
      batch.map((b) => fetchGoogleBookCover(b.title, b.author)),
    );
    batch.forEach((book, j) => {
      if (urls[j]) results.set(book.id, urls[j]!);
    });
  }

  return results;
}
