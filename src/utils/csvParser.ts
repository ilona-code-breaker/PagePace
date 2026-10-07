import { BookEntry, ArchetypeId } from '../types/book';
import { calculateElapsedDays, calculatePPD, getArchetypeByPPD, snapToPrecision01 } from './calculator';
import { findExactOrBestMatch } from '../data/bookKnowledgeBase';

export interface CsvParseOptions {
  startDateStrategy: 'infer_date_added' | 'same_day' | 'estimate_pace';
  defaultPageCountFallback: number;
  importShelfFilter: 'read_only' | 'all';
}

export interface NormalizedCsvRow {
  rawTitle: string;
  title: string;
  author: string;
  isbn?: string;
  totalPages: number;
  hasAutoFilledPages: boolean;
  shelf: 'read' | 'currently-reading' | 'to-read' | 'other';
  dateRead?: string; // YYYY-MM-DD
  dateAdded?: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  finishDate: string; // YYYY-MM-DD
  elapsedDays: number;
  ppd: number;
  archetypeId: ArchetypeId;
  rating: number;
  review: string;
  genre: string;
  publisher?: string;
  publishedYear?: number;
}

export interface CsvAnalysisResult {
  totalRows: number;
  validRows: NormalizedCsvRow[];
  skippedRows: number;
  readCount: number;
  currentlyReadingCount: number;
  toReadCount: number;
  missingPagesCount: number;
  headersDetected: string[];
}

/**
 * Robust RFC-4180 client-side CSV parser.
 * Handles embedded newlines, quotes, commas, and BOM without external dependencies.
 */
export function parseCsvRaw(csvText: string): string[][] {
  // Strip BOM
  let text = csvText.replace(/^\uFEFF/, '');
  if (!text.trim()) return [];

  // Detect delimiter: check first line for comma vs semicolon vs tab
  const firstLine = text.split(/\r\n|\n|\r/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  } else if (firstLine.includes('\t') && !firstLine.includes(',')) {
    delimiter = '\t';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field/row if any
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Cleans Goodreads ISBN formatting, e.g. ="9780593135204" or ="" or dashes.
 */
export function cleanGoodreadsIsbn(raw?: string): string | undefined {
  if (!raw) return undefined;
  // Remove ="..." wrapper or quotes or equals
  const clean = raw.replace(/^="?|"?$/g, '').replace(/[^0-9X]/gi, '').trim();
  return clean.length >= 8 ? clean : undefined;
}

/**
 * Normalizes date strings (YYYY/MM/DD, MM/DD/YYYY, YYYY-MM-DD, etc.) into ISO YYYY-MM-DD.
 */
export function parseDateToIso(rawDate?: string): string | undefined {
  if (!rawDate || !rawDate.trim()) return undefined;
  const d = rawDate.trim();

  // 1. Matches YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = d.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Matches MM/DD/YYYY
  const mdyMatch = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const year = mdyMatch[3];
    const month = mdyMatch[1].padStart(2, '0');
    const day = mdyMatch[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. Native Date parse fallback
  const parsedTimestamp = Date.parse(d);
  if (!isNaN(parsedTimestamp)) {
    const dt = new Date(parsedTimestamp);
    return dt.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Cleans title of extra series info like "Fourth Wing (The Empyrean, #1)"
 */
export function cleanTitleString(title: string): string {
  if (!title) return 'Untitled';
  // Strip trailing series notes if needed, but preserve main title
  return title.trim();
}

/**
 * Normalizes and standardizes genres to clean title case.
 */
export function normalizeStandardGenre(genre: string): string {
  const g = genre.trim();
  const lower = g.toLowerCase();
  if (lower === 'scifi' || lower === 'sci-fi' || lower === 'science fiction' || lower === 'science-fiction') {
    return 'Sci-Fi';
  }
  if (lower === 'nonfiction' || lower === 'non-fiction') return 'Non-Fiction';
  if (lower === 'historical-fiction' || lower === 'historical fiction') return 'Historical Fiction';
  if (lower === 'ya dystopian' || lower === 'dystopian' || lower === 'dystopia') return 'YA Dystopian';
  if (lower === 'lit fic' || lower === 'literary' || lower === 'literary fiction') return 'Literary Fiction';
  if (lower === 'romance' || lower === 'romantasy') return 'Romance';
  if (lower === 'fantasy') return 'Fantasy';
  if (lower === 'thriller' || lower === 'mystery' || lower === 'crime') return 'Thriller';
  if (lower === 'horror') return 'Horror';
  if (lower === 'classics' || lower === 'classic') return 'Classics';
  if (lower === 'young adult' || lower === 'ya') return 'Young Adult';

  // Capitalize first letter
  return g.charAt(0).toUpperCase() + g.slice(1);
}

/**
 * Checks incoming books against the built-in knowledge base and bookshelf tags
 * to verify and populate standard genre tags (e.g. 'Fantasy', 'Sci-Fi', 'Romance').
 */
export function verifyAndPopulateGenre(
  title: string,
  author?: string,
  rawGenreField?: string,
  rawShelf?: string
): string {
  // 1. Check internal knowledge base for verified match
  const kbMatch = findExactOrBestMatch(title);
  if (kbMatch && kbMatch.genre) {
    return normalizeStandardGenre(kbMatch.genre);
  }

  // 2. Parse raw genre / bookshelf string (e.g. Goodreads bookshelves: "fantasy, favorites, ya-fantasy")
  const combinedText = `${rawGenreField || ''} ${rawShelf || ''}`.toLowerCase();

  if (combinedText.includes('romantasy')) return 'Romance';
  if (combinedText.includes('sci-fi') || combinedText.includes('scifi') || combinedText.includes('science fiction') || combinedText.includes('space opera')) return 'Sci-Fi';
  if (combinedText.includes('fantasy') || combinedText.includes('magic')) return 'Fantasy';
  if (combinedText.includes('romance') || combinedText.includes('contemporary-romance')) return 'Romance';
  if (combinedText.includes('thriller') || combinedText.includes('mystery') || combinedText.includes('crime') || combinedText.includes('suspense')) return 'Thriller';
  if (combinedText.includes('horror')) return 'Horror';
  if (combinedText.includes('dystopia') || combinedText.includes('dystopian')) return 'YA Dystopian';
  if (combinedText.includes('historical fiction') || combinedText.includes('historical')) return 'Historical Fiction';
  if (combinedText.includes('non-fiction') || combinedText.includes('nonfiction') || combinedText.includes('biography') || combinedText.includes('memoir') || combinedText.includes('self-help')) return 'Non-Fiction';
  if (combinedText.includes('classic') || combinedText.includes('classics')) return 'Classics';
  if (combinedText.includes('literary') || combinedText.includes('lit-fic')) return 'Literary Fiction';
  if (combinedText.includes('young adult') || combinedText.includes('ya')) return 'Young Adult';

  // 3. Fallback to clean raw string if specified, or 'Fiction'
  if (rawGenreField && rawGenreField.trim()) {
    return normalizeStandardGenre(rawGenreField.trim());
  }

  return 'Fiction';
}

/**
 * Analyzes and normalizes parsed CSV table into PagePace records.
 */
export function analyzeAndNormalizeCsv(
  rows: string[][],
  options: CsvParseOptions
): CsvAnalysisResult {
  if (rows.length < 2) {
    return {
      totalRows: 0,
      validRows: [],
      skippedRows: 0,
      readCount: 0,
      currentlyReadingCount: 0,
      toReadCount: 0,
      missingPagesCount: 0,
      headersDetected: [],
    };
  }

  const rawHeaders = rows[0].map((h) => h.toLowerCase().trim());
  const headerMap: Record<string, number> = {};

  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  // Find index helper
  const findCol = (candidates: string[]): number => {
    for (const c of candidates) {
      if (headerMap[c] !== undefined) return headerMap[c];
    }
    // Also try fuzzy contains
    for (const c of candidates) {
      const idx = rawHeaders.findIndex((h) => h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleIdx = findCol(['title', 'book title', 'book_title', 'book', 'name', 'work']);
  const authorIdx = findCol(['author', 'primary author', 'author l-f', 'writer', 'creators']);
  const isbn13Idx = findCol(['isbn13', 'isbn 13', 'isbn_13']);
  const isbnIdx = findCol(['isbn', 'identifier', 'asin']);
  const pagesIdx = findCol(['number of pages', 'pages', 'page count', 'total pages', 'num_pages']);
  const shelfIdx = findCol(['exclusive shelf', 'shelf', 'bookshelves', 'status', 'read status']);
  const dateReadIdx = findCol(['date read', 'date_read', 'date finished', 'read at', 'finish date', 'completed']);
  const dateAddedIdx = findCol(['date added', 'date_added', 'added at', 'start date', 'date started', 'created']);
  const genreColIdx = findCol(['genre', 'genres', 'bookshelves', 'bookshelves with positions', 'tags', 'subject', 'category']);
  const ratingIdx = findCol(['my rating', 'rating', 'star rating', 'user rating', 'stars']);
  const reviewIdx = findCol(['my review', 'review', 'notes', 'private notes', 'comments']);
  const publisherIdx = findCol(['publisher']);
  const yearIdx = findCol(['year published', 'original publication year', 'publication year', 'published year']);

  const validRows: NormalizedCsvRow[] = [];
  let skippedRows = 0;
  let readCount = 0;
  let currentlyReadingCount = 0;
  let toReadCount = 0;
  let missingPagesCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rawTitle = titleIdx !== -1 ? (row[titleIdx] || '').trim() : '';
    if (!rawTitle) {
      skippedRows++;
      continue;
    }

    const title = cleanTitleString(rawTitle);
    const author = authorIdx !== -1 ? (row[authorIdx] || '').trim() : 'Unknown Author';

    // ISBN clean
    const rawIsbn = isbn13Idx !== -1 ? row[isbn13Idx] : isbnIdx !== -1 ? row[isbnIdx] : undefined;
    const isbn = cleanGoodreadsIsbn(rawIsbn);

    // Shelf mapping
    const rawShelf = shelfIdx !== -1 ? (row[shelfIdx] || '').toLowerCase().trim() : '';
    let shelf: 'read' | 'currently-reading' | 'to-read' | 'other' = 'read';
    if (rawShelf.includes('currently') || rawShelf === 'currently-reading') {
      shelf = 'currently-reading';
      currentlyReadingCount++;
    } else if (rawShelf.includes('to-read') || rawShelf.includes('want to read') || rawShelf === 'to-read') {
      shelf = 'to-read';
      toReadCount++;
    } else {
      shelf = 'read';
      readCount++;
    }

    // If options specify read_only and row is not read, skip or include according to option
    if (options.importShelfFilter === 'read_only' && shelf !== 'read') {
      skippedRows++;
      continue;
    }

    // Page count resolution
    let rawPages = pagesIdx !== -1 ? parseInt(row[pagesIdx], 10) : 0;
    let totalPages = !isNaN(rawPages) && rawPages > 0 ? rawPages : 0;
    let hasAutoFilledPages = false;

    // Genre verification & normalization
    const rawGenreVal = genreColIdx !== -1 ? row[genreColIdx] : undefined;
    const rawShelfVal = shelfIdx !== -1 ? row[shelfIdx] : undefined;
    let genre = verifyAndPopulateGenre(title, author, rawGenreVal, rawShelfVal);

    // Auto-fill page count fallback via local knowledge base if 0
    if (totalPages <= 0) {
      const match = findExactOrBestMatch(title);
      if (match && match.totalPages > 0) {
        totalPages = match.totalPages;
        if (match.genre) {
          genre = normalizeStandardGenre(match.genre);
        }
        hasAutoFilledPages = true;
      } else {
        totalPages = options.defaultPageCountFallback || 350;
        missingPagesCount++;
      }
    } else {
      // Find verified genre from knowledge base if genre was generic 'Fiction'
      if (genre === 'Fiction') {
        const match = findExactOrBestMatch(title);
        if (match?.genre) {
          genre = normalizeStandardGenre(match.genre);
        }
      }
    }

    // Dates & Velocity
    const rawDateRead = dateReadIdx !== -1 ? row[dateReadIdx] : undefined;
    const rawDateAdded = dateAddedIdx !== -1 ? row[dateAddedIdx] : undefined;
    const dateRead = parseDateToIso(rawDateRead);
    const dateAdded = parseDateToIso(rawDateAdded);

    // Finish Date
    const finishDate = dateRead || dateAdded || todayStr;

    // Start Date & Velocity Strategy
    let startDate = finishDate;
    if (options.startDateStrategy === 'infer_date_added' && dateAdded && dateAdded <= finishDate) {
      // If date added is earlier, use it as start date!
      startDate = dateAdded;
    } else if (options.startDateStrategy === 'estimate_pace') {
      // Estimate reasonable reading time based on pages (e.g. 50 PPD -> days = pages / 50)
      const estimatedDays = Math.max(1, Math.round(totalPages / 50));
      const finishTime = new Date(finishDate).getTime();
      const startTime = finishTime - (estimatedDays - 1) * 24 * 60 * 60 * 1000;
      startDate = new Date(startTime).toISOString().split('T')[0];
    } else {
      // Same day (fallback 1 elapsed day)
      startDate = finishDate;
    }

    const elapsedDays = calculateElapsedDays(startDate, finishDate);
    const ppd = calculatePPD(totalPages, elapsedDays);
    const archetype = getArchetypeByPPD(ppd);

    // Rating
    let rawRating = ratingIdx !== -1 ? parseFloat(row[ratingIdx]) : 0;
    let rating = 4.0;
    if (!isNaN(rawRating) && rawRating > 0) {
      rating = snapToPrecision01(Math.min(5.0, rawRating));
    }

    // Review
    const review = reviewIdx !== -1 ? (row[reviewIdx] || '').trim() : '';

    // Publisher & Year
    const publisher = publisherIdx !== -1 ? (row[publisherIdx] || '').trim() : undefined;
    let publishedYear: number | undefined;
    if (yearIdx !== -1 && row[yearIdx]) {
      const y = parseInt(row[yearIdx], 10);
      if (!isNaN(y) && y > 1000 && y <= 2100) publishedYear = y;
    }

    validRows.push({
      rawTitle,
      title,
      author,
      isbn,
      totalPages,
      hasAutoFilledPages,
      shelf,
      dateRead,
      dateAdded,
      startDate,
      finishDate,
      elapsedDays,
      ppd,
      archetypeId: archetype.id,
      rating,
      review,
      genre,
      publisher: publisher || undefined,
      publishedYear,
    });
  }

  return {
    totalRows: rows.length - 1,
    validRows,
    skippedRows,
    readCount,
    currentlyReadingCount,
    toReadCount,
    missingPagesCount,
    headersDetected: rawHeaders,
  };
}

/**
 * Checks for duplicates against existing library books.
 */
export function partitionDuplicates(
  incoming: NormalizedCsvRow[],
  existing: BookEntry[]
): {
  newBooks: NormalizedCsvRow[];
  duplicates: { incoming: NormalizedCsvRow; existingBook: BookEntry }[];
} {
  const existingIsbnMap = new Map<string, BookEntry>();
  const existingTitleMap = new Map<string, BookEntry>();

  existing.forEach((b) => {
    if (b.isbn) {
      const clean = cleanGoodreadsIsbn(b.isbn);
      if (clean) existingIsbnMap.set(clean.toLowerCase(), b);
    }
    const titleKey = `${b.title.toLowerCase().trim()}:::${(b.author || '').toLowerCase().trim()}`;
    existingTitleMap.set(titleKey, b);
  });

  const newBooks: NormalizedCsvRow[] = [];
  const duplicates: { incoming: NormalizedCsvRow; existingBook: BookEntry }[] = [];

  incoming.forEach((row) => {
    let match: BookEntry | undefined;

    if (row.isbn && existingIsbnMap.has(row.isbn.toLowerCase())) {
      match = existingIsbnMap.get(row.isbn.toLowerCase());
    } else {
      const titleKey = `${row.title.toLowerCase().trim()}:::${row.author.toLowerCase().trim()}`;
      if (existingTitleMap.has(titleKey)) {
        match = existingTitleMap.get(titleKey);
      }
    }

    if (match) {
      duplicates.push({ incoming: row, existingBook: match });
    } else {
      newBooks.push(row);
    }
  });

  return { newBooks, duplicates };
}

/**
 * Converts a normalized CSV row into a persistent BookEntry.
 */
export function convertRowToBookEntry(row: NormalizedCsvRow, index: number): BookEntry {
  return {
    id: `csv-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    title: row.title,
    author: row.author,
    totalPages: row.totalPages,
    startDate: row.startDate,
    finishDate: row.finishDate,
    elapsedDays: row.elapsedDays,
    ppd: row.ppd,
    archetypeId: row.archetypeId,
    rating: row.rating,
    review: row.review,
    genre: row.genre,
    format: 'Physical',
    coverUrl: row.isbn ? `https://covers.openlibrary.org/b/isbn/${row.isbn}-M.jpg` : undefined,
    isbn: row.isbn,
    publisher: row.publisher,
    publishedYear: row.publishedYear,
    createdAt: Date.now() - index * 1000,
  };
}
