/**
 * @file genreApi.ts
 * @description Official API integration service for genre lookup and enrichment.
 * Implements a 2-stage "Cascading API Lookup" architecture:
 *
 * Stage 1: Primary ISBN Lookup
 * - Targets official structured fields via book's ISBN on Google Books (`volumeInfo.categories`)
 *   and Open Library (`subjects` / `subject` / works endpoint / ISBN edition record).
 * - If concrete macro-genres (from our strict 11 pillars) are found, resolves immediately.
 *
 * Stage 2: Secondary Title + Author Fallback (The Master Edition / US/UK Edition Cascade)
 * - If Stage 1 returns empty results, 'Unassigned', or missing subject arrays (or if no ISBN exists),
 *   cleans the title & primary author (stripping subtitles, series tags, edition notes like "(Paperback)"),
 *   and queries Google Books (`intitle: + inauthor:`) and Open Library (`title= + author=`).
 * - Resolves categories from the top matching master edition hit.
 *
 * Final Fallback:
 * - Falls back to internal PagePace Knowledge Base and signature author recognition.
 * - Only if ALL stages yield zero matching signals does the book remain 'Unassigned'.
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
export function sanitizeIsbn(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/^="?|"?$/g, '').replace(/[^0-9X]/gi, '').trim();
  return cleaned.length >= 8 ? cleaned : undefined;
}

/**
 * Cleans the book title for secondary API search:
 * - Strips edition tags e.g. "(Paperback)", "(Hardcover)", "[Kindle Edition]"
 * - Strips series notes e.g. "(The Empyrean, #1)", "(ACOTAR #2)", "(#1)"
 * - Strips subtitles after colon or dash if main title is sufficiently descriptive
 * - Removes stray special characters and trims whitespace
 */
export function cleanTitleForSearch(title: string): string {
  if (!title) return '';
  let cleaned = title.trim();

  // 1. Remove parenthetical or bracketed edition/series notes
  cleaned = cleaned.replace(
    /\s*\([^)]*(?:paperback|hardcover|edition|kindle|audiobook|mass market|#\d+|book\s+\d+|series)[^)]*\)/gi,
    ''
  );
  cleaned = cleaned.replace(
    /\s*\[[^\]]*(?:paperback|hardcover|edition|kindle|audiobook|mass market|#\d+|book\s+\d+|series)[^\]]*\]/gi,
    ''
  );
  // Remove generic trailing parentheticals containing numbers or common series markers e.g. "(The Empyrean, 1)"
  cleaned = cleaned.replace(/\s*\([^)]*#\d+[^)]*\)/g, '');
  cleaned = cleaned.replace(/\s*\([^)]*\)$/g, (match) => {
    if (/,\s*#?\d+/i.test(match) || /vol(ume)?\.?\s*\d+/i.test(match)) return '';
    return match;
  });

  // 2. Remove subtitle if separated by ':' or ' - ' when main title has >= 3 characters
  const colonIdx = cleaned.indexOf(':');
  if (colonIdx > 2) {
    const mainTitle = cleaned.substring(0, colonIdx).trim();
    if (mainTitle.length >= 3) {
      cleaned = mainTitle;
    }
  } else {
    const dashMatch = cleaned.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (dashMatch && dashMatch[1].trim().length >= 4) {
      cleaned = dashMatch[1].trim();
    }
  }

  // 3. Remove leading/trailing quotes and clean special chars
  cleaned = cleaned.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

  return cleaned || title.trim();
}

/**
 * Cleans author string for secondary API search:
 * - Handles "LastName, FirstName" format from Goodreads CSV exports
 * - Strips roles e.g. "(Foreword)", "(Editor)", "(Illustrator)"
 * - Takes primary author if multiple comma/semicolon/and separated
 */
export function cleanAuthorForSearch(author?: string): string {
  if (!author || !author.trim()) return '';
  let a = author.trim();

  // Remove role notes e.g. "(Illustrator)", "(Foreword)"
  a = a.replace(/\s*\([^)]*(?:editor|illustrator|translator|foreword|contributor|narrator)[^)]*\)/gi, '');

  // Handle "LastName, FirstName" (e.g. "Weir, Andy" -> "Andy Weir")
  if (a.includes(',') && !a.includes('&') && !a.toLowerCase().includes(' and ')) {
    const parts = a.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 2 && !parts[0].includes(' ') && parts[1].length > 0) {
      return `${parts[1]} ${parts[0]}`;
    }
  }

  // If multiple authors separated by & or "and", take primary author
  if (a.includes('&')) {
    a = a.split('&')[0].trim();
  } else if (a.toLowerCase().includes(' and ')) {
    a = a.split(/ and /i)[0].trim();
  }

  return a;
}

/**
 * Stage 1: Queries Google Books and Open Library by ISBN.
 * Returns matching MacroGenres if found, or empty array if no concrete genres resolved.
 */
async function queryGenresByIsbn(cleanIsbn: string): Promise<MasterGenre[]> {
  // 1A. Google Books by ISBN
  try {
    const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(cleanIsbn)}&maxResults=3&printType=books`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(googleApiUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
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
            return nonUnassigned;
          }
        }
      }
    }
  } catch {
    // Proceed to Open Library
  }

  // 1B. Open Library Search by ISBN
  try {
    const openLibUrl = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanIsbn)}&fields=title,author_name,subject,subject_facet,key,isbn&limit=2`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const olResponse = await fetch(openLibUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
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

        // If search doc omitted subjects, check work endpoint
        if (rawSubjects.length === 0 && doc.key) {
          try {
            const wController = new AbortController();
            const wTimeout = setTimeout(() => wController.abort(), 3000);
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
            return nonUnassigned;
          }
        }
      }
    }
  } catch {
    // Proceed to direct ISBN record
  }

  // 1C. Open Library direct ISBN edition lookup
  try {
    const isbnController = new AbortController();
    const isbnTimeout = setTimeout(() => isbnController.abort(), 3000);
    const isbnRes = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(cleanIsbn)}.json`, {
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
          return nonUnassigned;
        }
      }
    }
  } catch {
    // Stage 1 complete
  }

  return [];
}

/**
 * Stage 2: Secondary Title + Author Fallback.
 * Queries Google Books (intitle: + inauthor:) and Open Library (title= + author=)
 * for the master / mainstream edition to extract rich publisher categories.
 */
async function queryGenresByTitleAndAuthor(
  searchTitle: string,
  searchAuthor?: string
): Promise<MasterGenre[]> {
  const cleanT = cleanTitleForSearch(searchTitle);
  const cleanA = cleanAuthorForSearch(searchAuthor);
  if (!cleanT) return [];

  // 2A. Google Books structured search (intitle: + inauthor:)
  try {
    let queryParam = `intitle:${encodeURIComponent(cleanT)}`;
    if (cleanA) {
      queryParam += `+inauthor:${encodeURIComponent(cleanA)}`;
    }

    const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${queryParam}&maxResults=3&printType=books`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(googleApiUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
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
            return nonUnassigned;
          }
        }
      }
    }
  } catch {
    // Proceed to Open Library title + author
  }

  // 2B. Open Library structured search (title= + author=)
  try {
    let olParam = `title=${encodeURIComponent(cleanT)}`;
    if (cleanA) {
      olParam += `&author=${encodeURIComponent(cleanA)}`;
    }
    const openLibUrl = `https://openlibrary.org/search.json?${olParam}&fields=title,author_name,subject,subject_facet,key,edition_count&limit=3`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const olResponse = await fetch(openLibUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (olResponse.ok) {
      const olData = await olResponse.json();
      if (Array.isArray(olData.docs) && olData.docs.length > 0) {
        // Inspect docs in ranking order
        for (const doc of olData.docs) {
          let rawSubjects: string[] = [
            ...(doc.subject || []),
            ...(doc.subject_facet || []),
          ];

          // If search doc omitted subjects, check work endpoint
          if (rawSubjects.length === 0 && doc.key) {
            try {
              const wController = new AbortController();
              const wTimeout = setTimeout(() => wController.abort(), 3000);
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
              return nonUnassigned;
            }
          }
        }
      }
    }
  } catch {
    // Proceed to broad search
  }

  // 2C. Open Library broad query fallback (q=Title Author)
  try {
    const combinedQuery = `${cleanT} ${cleanA}`.trim();
    const broadUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(combinedQuery)}&fields=title,author_name,subject,subject_facet,key&limit=2`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const broadResponse = await fetch(broadUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (broadResponse.ok) {
      const broadData = await broadResponse.json();
      if (Array.isArray(broadData.docs) && broadData.docs.length > 0) {
        const doc = broadData.docs[0];
        let rawSubjects: string[] = [
          ...(doc.subject || []),
          ...(doc.subject_facet || []),
        ];

        if (rawSubjects.length === 0 && doc.key) {
          try {
            const wRes = await fetch(`https://openlibrary.org${doc.key}.json`);
            if (wRes.ok) {
              const wData = await wRes.json();
              if (Array.isArray(wData.subjects)) rawSubjects = wData.subjects;
            }
          } catch {}
        }

        if (rawSubjects.length > 0) {
          const resolved = normalizeGenres(rawSubjects, { fallbackToUnassigned: false });
          const nonUnassigned = resolved.filter((g) => g !== 'Unassigned');
          if (nonUnassigned.length > 0) {
            return nonUnassigned;
          }
        }
      }
    }
  } catch {
    // Broad search complete
  }

  return [];
}

/**
 * 2-Stage Cascading API Genre Lookup:
 *
 * Stage 1: Primary ISBN Lookup (Google Books & Open Library ISBN endpoints)
 * Stage 2: Secondary Title + Author Fallback (Google Books intitle+inauthor & Open Library title+author)
 * Final Fallback: Internal Knowledge Base & Landmark Author Profiles
 *
 * Returns deduplicated MacroGenres (or ['Unassigned'] if all stages fail).
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

  // 2. Stage 1: Primary ISBN Lookup (if ISBN available)
  if (cleanIsbn) {
    const stage1Genres = await queryGenresByIsbn(cleanIsbn);
    if (stage1Genres.length > 0) {
      multiGenreCache.set(cacheKey, stage1Genres);
      genreCache.set(cacheKey, stage1Genres[0]);
      return stage1Genres;
    }
  }

  // 3. Stage 2: Secondary Title + Author Fallback (Master / Mainstream Edition Cascade)
  // Executes if Stage 1 returned empty/unassigned or if no valid ISBN was provided
  const stage2Genres = await queryGenresByTitleAndAuthor(cleanTitle, author);
  if (stage2Genres.length > 0) {
    multiGenreCache.set(cacheKey, stage2Genres);
    genreCache.set(cacheKey, stage2Genres[0]);
    return stage2Genres;
  }

  // 4. Final Fallback: Internal Knowledge Base & Landmark Author Profiles
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

  // 5. No match found across all stages: return ['Unassigned']
  multiGenreCache.set(cacheKey, ['Unassigned']);
  genreCache.set(cacheKey, 'Unassigned');
  return ['Unassigned'];
}

/**
 * Queries Google Books & Open Library using the 2-stage cascading lookup
 * and normalizes the result into a single primary MacroGenre.
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
