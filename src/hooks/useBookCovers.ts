'use client';
import { useState, useEffect } from 'react';
import { prefetchCovers } from '@/lib/bookCovers';

/**
 * Hook: prefetch Google Books covers for a list of books.
 * Returns a Map<bookId, coverUrl> that updates as covers load.
 */
export function useBookCovers(
  books: Array<{ id: string; title: string; author: string }>,
): Map<string, string> {
  const [covers, setCovers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!books.length) return;
    let cancelled = false;

    prefetchCovers(books).then((result) => {
      if (!cancelled) setCovers(result);
    });

    return () => { cancelled = true; };
    // Re-run when book count changes (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books.length]);

  return covers;
}
