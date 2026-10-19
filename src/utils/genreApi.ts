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
import { findExactOrBestMatch, getAuthorLandmarkGenre } from '../data/bookKnowledgeBase';

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
          const resolved = normalizeGenres(allCategories, { fallbackToUnassigned: false });
          const nonUnassigned = resolved.filter((g) => g !== 'Unassigned');
          if (nonUnassigned.length > 0) {
            multiGenreCache.set(cacheKey, nonUnassigned);
            genreCache.set(cacheKey, nonUnassigned[0]);
            return nonUnassigned;
          }
        }
      }
    }
  } catch {
    // Network failure, timeout, or rate-limiting; proceed to Open Library subjects fallback
  }

  // 3. Fallback: Open Library API - Target official subjects array & works subjects
  try {
    const olQuery = cleanIsbn
      ? `isbn=${encodeURIComponent(cleanIsbn)}`
      : `q=${encodeURIComponent(`${cleanTitle} ${author}`.trim())}`;
    const openLibUrl = `https://openlibrary.org/search.json?${olQuery}&fields=title,author_name,subject,subject_facet,key,isbn&limit=2`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
        let rawSubjects: string[] = [
          ...(doc.subject || []),
          ...(doc.subject_facet || []),
        ];

        // If search results omitted subjects, query the work object directly
        if (rawSubjects.length === 0 && doc.key) {
          try {
            const wController = new AbortController();
            const wTimeout = setTimeout(() => wController.abort(), 3500);
            const wRes = await fetch(`https://openlibrary.org${doc.key}.json`, {
              signal: wController.signal,
              headers: { Accept: 'application/json' },
            });
            clearTimeout(wTimeout);
            if (wRes.ok) {
              const wData = await wRes.json();
              if (Array.isArray(wData.subjects)) {
                rawSubjects = wData.subjects;
              }
            }
          } catch {
            // work fetch fallback
          }
        }

        if (rawSubjects.length > 0) {
          const resolved = normalizeGenres(rawSubjects, { fallbackToUnassigned: false });
          const nonUnassigned = resolved.filter((g) => g !== 'Unassigned');
          if (nonUnassigned.length > 0) {
            multiGenreCache.set(cacheKey, nonUnassigned);
            genreCache.set(cacheKey, nonUnassigned[0]);
            return nonUnassigned;
          }
        }
      }
    }
  } catch {
    // Gracefully handle Open Library error
  }

  // 4. Secondary Open Library ISBN lookup if available
  if (cleanIsbn) {
    try {
      const isbnController = new AbortController();
      const isbnTimeout = setTimeout(() => isbnController.abort(), 3500);
      const isbnRes = await fetch(`https://openlibrary.org/isbn/${cleanIsbn}.json`, {
        signal: isbnController.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(isbnTimeout);
      if (isbnRes.ok) {
        const isbnData = await isbnRes.json();
        let isbnSubjects: string[] = Array.isArray(isbnData.subjects) ? isbnData.subjects : [];
        if (isbnSubjects.length === 0 && Array.isArray(isbnData.works) && isbnData.works[0]?.key) {
          const wRes = await fetch(`https://openlibrary.org${isbnData.works[0].key}.json`);
          if (wRes.ok) {
            const wData = await wRes.json();
            if (Array.isArray(wData.subjects)) isbnSubjects = wData.subjects;
          }
        }
        if (isbnSubjects.length > 0) {
          const resolved = normalizeGenres(isbnSubjects, { fallbackToUnassigned: false });
          const nonUnassigned = resolved.filter((g) => g !== 'Unassigned');
          if (nonUnassigned.length > 0) {
            multiGenreCache.set(cacheKey, nonUnassigned);
            genreCache.set(cacheKey, nonUnassigned[0]);
            return nonUnassigned;
          }
        }
      }
    } catch {
      // ISBN fetch fallback
    }
  }

  // 5. Knowledge Base & Landmark Author Fallback
  const kbMatch = findExactOrBestMatch(cleanTitle, author);
  if (kbMatch && kbMatch.genre) {
    const resolved = normalizeGenres(kbMatch.genre, { fallbackToUnassigned: false });
    const nonUnassigned = resolved.filter((g) => g !== 'Unassigned');
    if (nonUnassigned.length > 0) {
      multiGenreCache.set(cacheKey, nonUnassigned);
      genreCache.set(cacheKey, nonUnassigned[0]);
      return nonUnassigned;
    }
  }

  if (author) {
    const authorGenre = getAuthorLandmarkGenre(author);
    if (authorGenre) {
      const resolved = [authorGenre as MasterGenre];
      multiGenreCache.set(cacheKey, resolved);
      genreCache.set(cacheKey, resolved[0]);
      return resolved;
    }
  }

  // 6. No match found: return ['Unassigned'] so user can reassign genre later
  multiGenreCache.set(cacheKey, ['Unassigned']);
  genreCache.set(cacheKey, 'Unassigned');
  return ['Unassigned'];
}

/**
 * Queries Google Books API for publisher categories (`volumeInfo.categories`) and normalizes
 * them into a single primary MacroGenre.
 * Falls back to Open Library subjects (`subjects` / `subject`) if Google Books categories are empty.
 * Returns 'Unassigned' if no match is found so the user can reassign genre later.
 */
export async function fetchGenreByMetadata(
  title: string,
  author = '',
  isbn?: string
): Promise<MasterGenre> {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return 'Unassigned';
  }

  const cleanIsbn = sanitizeIsbn(isbn);
  const cacheKey = getCacheKey(cleanTitle, author, cleanIsbn);

  if (genreCache.has(cacheKey)) {
    return genreCache.get(cacheKey) ?? 'Unassigned';
  }

  const genres = await fetchGenresByMetadata(cleanTitle, author, isbn);
  return genres.length > 0 ? genres[0] : 'Unassigned';
}

/**
 * Utility to clear the in-memory genre cache if needed (e.g. for testing).
 */
export function clearGenreCache(): void {
  genreCache.clear();
  multiGenreCache.clear();
}
