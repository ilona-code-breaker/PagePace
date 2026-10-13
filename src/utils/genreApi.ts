/**
 * @file genreApi.ts
 * @description Official API integration service for genre lookup and enrichment.
 * Strictly queries Google Books API (`volumeInfo.categories`) with Open Library
 * (`subjects` / `subject`) fallback.
 *
 * Adheres strictly to the 11 Macro-Genre architecture:
 * - Looks only at official structured fields: volumeInfo.categories and doc.subject(s).
 * - Multi-genre support: extracts full MacroGenre[] array or single primary genre.
 * - Never scans titles, descriptions, or raw text blobs that risk trap words like "history".
 * - Returns null / [] when no matching category is found (no generic fallback bucket).
 */

import { MasterGenre, normalizeGenre, normalizeGenres } from './genreMapper';

/**
 * In-memory cache for resolved primary genres to eliminate duplicate API round-trips
 * when parsing multi-row books or re-rendering components.
 */
const genreCache = new Map<string, MasterGenre | null>();
const multiGenreCache = new Map<string, MasterGenre[]>();

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
 * Cleans an ISBN by removing wrapper syntax (e.g., ="" or dashes).
 */
function sanitizeIsbn(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/^="?|"?$/g, '').replace(/[^0-9X]/gi, '').trim();
  return cleaned.length >= 8 ? cleaned : undefined;
}

/**
 * Queries Google Books API for publisher categories (`volumeInfo.categories`) and normalizes
 * them into an array of our exact 11 MacroGenres (`MacroGenre[]`).
 * Falls back to Open Library subjects (`subjects` / `subject`) if Google Books categories are empty.
 * Returns empty array [] if no match is found (zero fallback bucket).
 */
export async function fetchGenresByMetadata(
  title: string,
  author = '',
  isbn?: string
): Promise<MasterGenre[]> {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return [];
  }

  const cleanIsbn = sanitizeIsbn(isbn);
  const cacheKey = getCacheKey(cleanTitle, author, cleanIsbn);

  // 1. Return cached value if available
  if (multiGenreCache.has(cacheKey)) {
    return multiGenreCache.get(cacheKey) || [];
  }

  // 2. Query Google Books API - Target official volumeInfo.categories ONLY
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
        // Collect official publisher volumeInfo.categories
        const allCategories: string[] = [];
        for (const item of data.items) {
          const categories: string[] | undefined = item.volumeInfo?.categories;
          if (Array.isArray(categories)) {
            allCategories.push(...categories);
          }
        }
        if (allCategories.length > 0) {
          const resolved = normalizeGenres(allCategories);
          if (resolved.length > 0) {
            multiGenreCache.set(cacheKey, resolved);
            genreCache.set(cacheKey, resolved[0]);
            return resolved;
          }
        }
      }
    }
  } catch {
    // Network failure, timeout, or rate-limiting; proceed to Open Library subjects fallback
  }

  // 3. Fallback: Open Library API - Target official subjects array ONLY
  try {
    const olQuery = cleanIsbn
      ? `isbn=${encodeURIComponent(cleanIsbn)}`
      : `q=${encodeURIComponent(`${cleanTitle} ${author}`.trim())}`;
    const openLibUrl = `https://openlibrary.org/search.json?${olQuery}&fields=title,author_name,subject,subject_facet&limit=2`;

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
          const resolved = normalizeGenres(rawSubjects);
          if (resolved.length > 0) {
            multiGenreCache.set(cacheKey, resolved);
            genreCache.set(cacheKey, resolved[0]);
            return resolved;
          }
        }
      }
    }
  } catch {
    // Gracefully handle Open Library error
  }

  // 4. No match found: return empty array to isolate missing/unmatched metadata (zero fallback)
  multiGenreCache.set(cacheKey, []);
  genreCache.set(cacheKey, null);
  return [];
}

/**
 * Queries Google Books API for publisher categories (`volumeInfo.categories`) and normalizes
 * them into a single primary MacroGenre.
 * Falls back to Open Library subjects (`subjects` / `subject`) if Google Books categories are empty.
 * Returns null if no match is found (zero fallback bucket).
 */
export async function fetchGenreByMetadata(
  title: string,
  author = '',
  isbn?: string
): Promise<MasterGenre | null> {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return null;
  }

  const cleanIsbn = sanitizeIsbn(isbn);
  const cacheKey = getCacheKey(cleanTitle, author, cleanIsbn);

  if (genreCache.has(cacheKey)) {
    return genreCache.get(cacheKey) ?? null;
  }

  const genres = await fetchGenresByMetadata(cleanTitle, author, isbn);
  return genres.length > 0 ? genres[0] : null;
}

/**
 * Utility to clear the in-memory genre cache if needed (e.g. for testing).
 */
export function clearGenreCache(): void {
  genreCache.clear();
  multiGenreCache.clear();
}
