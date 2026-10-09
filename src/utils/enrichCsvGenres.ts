/**
 * @file enrichCsvGenres.ts
 * @description Batch enrichment pipeline for Goodreads CSV imports and imported book state.
 * Identifies books with missing, generic ("Fiction"), or unverified genres and asynchronously
 * enriches them via fetchGenreByMetadata in rate-limited batches with progress reporting.
 */

import { MasterGenre, isMasterGenre } from './genreMapper';
import { fetchGenreByMetadata } from './genreApi';

/**
 * Minimal book interface contract required for genre enrichment.
 * Compatible with BookEntry, NormalizedCsvRow, and custom spreadsheet objects.
 */
export interface EnrichableBook {
  title: string;
  author?: string;
  isbn?: string;
  genre?: string;
  [key: string]: any;
}

/**
 * Options for fine-tuning the batch enrichment pipeline.
 */
export interface EnrichCsvOptions {
  /**
   * Number of simultaneous API requests per batch (default: 3).
   * Kept small to stay well below Google Books and Open Library rate limits.
   */
  batchSize?: number;

  /**
   * Pause in milliseconds between consecutive batches (default: 200ms).
   */
  delayBetweenBatchesMs?: number;

  /**
   * Optional callback providing real-time progress updates for React state/UI bars.
   */
  onProgress?: (progress: {
    processed: number;
    total: number;
    percentage: number;
    currentTitle?: string;
    enrichedCount: number;
  }) => void;

  /**
   * Optional AbortSignal to cancel remaining requests if the user closes the modal.
   */
  signal?: AbortSignal;

  /**
   * Whether to only enrich books that have empty or generic genres.
   * If false, forces re-enrichment of all rows (default: true).
   */
  onlyGenericOrEmpty?: boolean;
}

/**
 * Result returned after batch processing.
 */
export interface EnrichCsvResult<T extends EnrichableBook> {
  enrichedBooks: T[];
  totalProcessed: number;
  enrichedCount: number;
  skippedCount: number;
}

/**
 * Helper to determine whether a genre string is considered blank, generic, or uninformative.
 */
export function isGenericOrEmptyGenre(genre?: string): boolean {
  if (!genre) return true;
  const clean = genre.trim().toLowerCase();
  return (
    clean === '' ||
    clean === 'fiction' ||
    clean === 'general fiction' ||
    clean === 'uncategorized' ||
    clean === 'unknown' ||
    clean === 'books' ||
    clean === 'read' ||
    clean === 'novel'
  );
}

/**
 * Simple async delay utility for client-side rate-limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enriches an array of parsed CSV books by inspecting each record's genre.
 * If the genre is missing, generic, or blank, queries the API and normalizes
 * the genre into a MasterGenre token.
 *
 * @param books Array of book items from CSV parser or local library
 * @param options Pipeline configuration options
 * @returns Object containing enriched copies of the books and statistics
 *
 * @example
 * ```ts
 * const { enrichedBooks, enrichedCount } = await enrichCsvGenres(parsedRows, {
 *   batchSize: 3,
 *   onProgress: ({ processed, total, percentage }) => {
 *     setProgress(percentage);
 *   }
 * });
 * ```
 */
export async function enrichCsvGenres<T extends EnrichableBook>(
  books: T[],
  options: EnrichCsvOptions = {}
): Promise<EnrichCsvResult<T>> {
  if (!Array.isArray(books) || books.length === 0) {
    return {
      enrichedBooks: [],
      totalProcessed: 0,
      enrichedCount: 0,
      skippedCount: 0,
    };
  }

  const {
    batchSize = 3,
    delayBetweenBatchesMs = 200,
    onProgress,
    signal,
    onlyGenericOrEmpty = true,
  } = options;

  const total = books.length;
  let enrichedCount = 0;
  let skippedCount = 0;
  const result: T[] = new Array(total);

  // Identify which indices require API enrichment
  const indicesToEnrich: number[] = [];
  for (let i = 0; i < total; i++) {
    const book = books[i];
    const shouldLookup = onlyGenericOrEmpty
      ? isGenericOrEmptyGenre(book.genre)
      : true;

    if (shouldLookup && book.title && book.title.trim().length > 0) {
      indicesToEnrich.push(i);
    } else {
      // Retain existing genre (or normalize it if it's already specific)
      result[i] = {
        ...book,
        genre: book.genre?.trim() || 'General Fiction',
      };
      skippedCount++;
    }
  }

  let processedCount = skippedCount;

  // Initial progress notification
  if (onProgress) {
    onProgress({
      processed: processedCount,
      total,
      percentage: total > 0 ? Math.round((processedCount / total) * 100) : 100,
      enrichedCount,
    });
  }

  // Process candidates in controlled batches
  for (let b = 0; b < indicesToEnrich.length; b += batchSize) {
    if (signal?.aborted) {
      // If aborted, populate remaining items without API lookup
      for (let rest = b; rest < indicesToEnrich.length; rest++) {
        const idx = indicesToEnrich[rest];
        result[idx] = { ...books[idx], genre: books[idx].genre || 'General Fiction' };
      }
      break;
    }

    const currentBatchIndices = indicesToEnrich.slice(b, b + batchSize);

    // Run batch requests in parallel
    const batchPromises = currentBatchIndices.map(async (bookIdx) => {
      const originalBook = books[bookIdx];
      try {
        const resolvedGenre: MasterGenre = await fetchGenreByMetadata(
          originalBook.title,
          originalBook.author || '',
          originalBook.isbn
        );

        const wasUpdated = resolvedGenre !== 'General Fiction' || isGenericOrEmptyGenre(originalBook.genre);
        if (wasUpdated) {
          enrichedCount++;
        }

        result[bookIdx] = {
          ...originalBook,
          genre: resolvedGenre,
        };
      } catch {
        // Fallback gracefully on item error
        result[bookIdx] = {
          ...originalBook,
          genre: originalBook.genre?.trim() || 'General Fiction',
        };
      } finally {
        processedCount++;
        if (onProgress) {
          onProgress({
            processed: processedCount,
            total,
            percentage: Math.min(100, Math.round((processedCount / total) * 100)),
            currentTitle: originalBook.title,
            enrichedCount,
          });
        }
      }
    });

    await Promise.all(batchPromises);

    // Apply delay between batches to respect third-party rate limits
    if (b + batchSize < indicesToEnrich.length && delayBetweenBatchesMs > 0) {
      await sleep(delayBetweenBatchesMs);
    }
  }

  return {
    enrichedBooks: result,
    totalProcessed: total,
    enrichedCount,
    skippedCount,
  };
}
