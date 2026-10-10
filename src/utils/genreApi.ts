/**
 * @file genreApi.ts
 * @description Client-side API integration for genre lookup and enrichment.
 * Queries Google Books API (with Open Library subject fallback) in the browser,
 * passing metadata through the MasterGenre normalizer with in-memory caching
 * and resilient timeout/error handling.
 */

import { MasterGenre, normalizeGenre } from './genreMapper';

/**
 * In-memory cache for resolved genres to eliminate duplicate API round-trips
 * when parsing multi-row CSVs or re-rendering components.
 */
const genreCache = new Map<string, MasterGenre>();

/**
 * Constructs a normalized cache key from title, author, and isbn.
 */
function getCacheKey(title: string, author = '', isbn = ''): string {
  const cleanTitle = title.trim().toLowerCase();
  const cleanAuthor = author.trim().toLowerCase();
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').toLowerCase();
  return `${cleanIsbn}:::${cleanTitle}:::${cleanAuthor}`;
}

/**
 * Cleans an ISBN by removing Goodreads wrapper syntax (e.g., ="" or dashes).
 */
function sanitizeIsbn(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/^="?|"?$/g, '').replace(/[^0-9X]/gi, '').trim();
  return cleaned.length >= 8 ? cleaned : undefined;
}

/**
 * Queries Google Books API for volume categories and normalizes them into a MasterGenre.
 * Falls back to Open Library subjects if Google Books categories are empty, and defaults
 * to 'Literary & Contemporary Fiction' upon network error or lack of classification.
 *
 * @param title Book title to search
 * @param author Optional book author to refine search accuracy
 * @param isbn Optional ISBN10 or ISBN13 for exact volume lookup
 * @returns Promise resolving to a standardized MasterGenre
 */
export async function fetchGenreByMetadata(
  title: string,
  author = '',
  isbn?: string
): Promise<MasterGenre> {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return 'Literary & Contemporary Fiction';
  }

  const cleanIsbn = sanitizeIsbn(isbn);
  const cacheKey = getCacheKey(cleanTitle, author, cleanIsbn);

  // 1. Return cached value if available
  if (genreCache.has(cacheKey)) {
    return genreCache.get(cacheKey)!;
  }

  // 2. Query Google Books API
  try {
    let queryParam = '';
    if (cleanIsbn) {
      queryParam = `isbn:${encodeURIComponent(cleanIsbn)}`;
    } else if (author.trim()) {
      queryParam = `intitle:${encodeURIComponent(cleanTitle)}+inauthor:${encodeURIComponent(author.trim())}`;
    } else {
      queryParam = encodeURIComponent(cleanTitle);
    }

    const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${queryParam}&maxResults=3&printType=books`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(googleApiUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        // Find first item with volumeInfo categories
        for (const item of data.items) {
          const categories: string[] | undefined = item.volumeInfo?.categories;
          if (Array.isArray(categories) && categories.length > 0) {
            const resolvedGenre = normalizeGenre(categories);
            // If the resolved genre is not the generic default, cache and return
            if (resolvedGenre !== 'Literary & Contemporary Fiction') {
              genreCache.set(cacheKey, resolvedGenre);
              return resolvedGenre;
            }
          }
        }

        // If categories were generic or missing, check description text for strong signals
        const firstDescription: string | undefined = data.items[0]?.volumeInfo?.description;
        if (firstDescription && firstDescription.length > 20) {
          const fromDescription = normalizeGenre(firstDescription);
          if (fromDescription !== 'Literary & Contemporary Fiction') {
            genreCache.set(cacheKey, fromDescription);
            return fromDescription;
          }
        }
      }
    }
  } catch {
    // Network failure, timeout, or rate-limiting; continue to Open Library fallback
  }

  // 3. Secondary Fallback: Open Library Subjects API
  try {
    const olQuery = cleanIsbn
      ? `isbn=${encodeURIComponent(cleanIsbn)}`
      : `q=${encodeURIComponent(`${cleanTitle} ${author}`.trim())}`;
    const openLibUrl = `https://openlibrary.org/search.json?${olQuery}&limit=2`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const olResponse = await fetch(openLibUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (olResponse.ok) {
      const olData = await olResponse.json();
      if (Array.isArray(olData.docs) && olData.docs.length > 0) {
        const doc = olData.docs[0];
        const rawSubjects: string[] = [
          ...(doc.subject || []),
          ...(doc.subject_facet || []),
        ];

        if (rawSubjects.length > 0) {
          const resolvedGenre = normalizeGenre(rawSubjects);
          genreCache.set(cacheKey, resolvedGenre);
          return resolvedGenre;
        }
      }
    }
  } catch {
    // Gracefully handle Open Library error
  }

  // 4. Default fallback when no specific category is identified
  const fallbackGenre: MasterGenre = 'Literary & Contemporary Fiction';
  genreCache.set(cacheKey, fallbackGenre);
  return fallbackGenre;
}

/**
 * Utility to clear the in-memory genre cache if needed (e.g. for testing).
 */
export function clearGenreCache(): void {
  genreCache.clear();
}
