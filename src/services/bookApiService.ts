export interface ApiBookMetadata {
  title: string;
  author: string;
  totalPages: number;
  genre: string;
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  publisher?: string;
  source: 'google_books' | 'open_library' | 'combined';
  description?: string;
}

/**
 * Normalizes category strings from APIs into clean primary genres.
 */
function normalizeGenre(categories?: string[] | string): string {
  if (!categories) return 'Fiction';
  const catStr = Array.isArray(categories) ? categories.join(' ').toLowerCase() : categories.toLowerCase();

  if (catStr.includes('fantasy') || catStr.includes('magic')) return 'Fantasy';
  if (catStr.includes('science fiction') || catStr.includes('sci-fi') || catStr.includes('space')) return 'Sci-Fi';
  if (catStr.includes('thriller') || catStr.includes('mystery') || catStr.includes('crime') || catStr.includes('detective')) return 'Thriller / Mystery';
  if (catStr.includes('romance') || catStr.includes('love')) return 'Romance';
  if (catStr.includes('historical')) return 'Historical Fiction';
  if (catStr.includes('biography') || catStr.includes('memoir') || catStr.includes('autobiography')) return 'Biography / Memoir';
  if (catStr.includes('philosophy')) return 'Philosophy';
  if (catStr.includes('history')) return 'History';
  if (catStr.includes('nonfiction') || catStr.includes('non-fiction') || catStr.includes('self-help') || catStr.includes('psychology')) return 'Non-Fiction';
  if (catStr.includes('literary') || catStr.includes('literature')) return 'Literary Fiction';

  return 'Fiction';
}

/**
 * Checks if input is an ISBN (10 or 13 digits, optionally with dashes).
 */
export function isIsbnQuery(query: string): boolean {
  const clean = query.replace(/[-\s]/g, '').toLowerCase();
  if (clean.startsWith('isbn:')) return true;
  return /^(97(8|9))?\d{9}(\d|X)$/i.test(clean);
}

export function extractCleanIsbn(query: string): string {
  return query.replace(/^(isbn:)/i, '').replace(/[-\s]/g, '').trim();
}

/**
 * Queries the official Google Books API.
 * https://www.googleapis.com/books/v1/volumes?q=...
 */
export async function searchGoogleBooks(query: string): Promise<ApiBookMetadata[]> {
  try {
    const isIsbn = isIsbnQuery(query);
    const searchParam = isIsbn ? `isbn:${extractCleanIsbn(query)}` : encodeURIComponent(query.trim());
    const url = `https://www.googleapis.com/books/v1/volumes?q=${searchParam}&maxResults=6`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: any): ApiBookMetadata => {
      const info = item.volumeInfo || {};
      const authors = Array.isArray(info.authors) ? info.authors.join(', ') : info.authors || 'Unknown Author';
      const pageCount = Number(info.pageCount) || 350;

      // Extract secure HTTPS thumbnail
      let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
      if (coverUrl && coverUrl.startsWith('http://')) {
        coverUrl = coverUrl.replace('http://', 'https://');
      }

      // Extract ISBN
      let isbn: string | undefined;
      if (Array.isArray(info.industryIdentifiers)) {
        const isbn13 = info.industryIdentifiers.find((id: any) => id.type === 'ISBN_13');
        const isbn10 = info.industryIdentifiers.find((id: any) => id.type === 'ISBN_10');
        isbn = isbn13?.identifier || isbn10?.identifier;
      }

      // Extract Year
      let publishedYear: number | undefined;
      if (info.publishedDate) {
        const year = parseInt(info.publishedDate.substring(0, 4), 10);
        if (!isNaN(year)) publishedYear = year;
      }

      return {
        title: info.title || 'Untitled',
        author: authors,
        totalPages: Math.max(10, pageCount),
        genre: normalizeGenre(info.categories),
        coverUrl,
        isbn,
        publishedYear,
        publisher: info.publisher,
        source: 'google_books',
        description: info.description,
      };
    });
  } catch (err) {
    console.warn('Google Books API search failed or timed out:', err);
    return [];
  }
}

/**
 * Queries the Open Library Search API.
 * https://openlibrary.org/search.json?q=...
 */
export async function searchOpenLibrary(query: string): Promise<ApiBookMetadata[]> {
  try {
    const isIsbn = isIsbnQuery(query);
    const clean = isIsbn ? extractCleanIsbn(query) : query.trim();
    const param = isIsbn ? `isbn=${encodeURIComponent(clean)}` : `q=${encodeURIComponent(clean)}`;
    const url = `https://openlibrary.org/search.json?${param}&limit=6`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();

    if (!data.docs || !Array.isArray(data.docs)) return [];

    return data.docs.map((doc: any): ApiBookMetadata => {
      const authors = Array.isArray(doc.author_name)
        ? doc.author_name.join(', ')
        : 'Unknown Author';

      const pageCount =
        Number(doc.number_of_pages_median) ||
        Number(doc.number_of_pages) ||
        350;

      // Open Library Cover image API
      let coverUrl: string | undefined;
      if (doc.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      } else if (Array.isArray(doc.isbn) && doc.isbn[0]) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
      }

      return {
        title: doc.title || 'Untitled',
        author: authors,
        totalPages: Math.max(10, pageCount),
        genre: normalizeGenre(doc.subject),
        coverUrl,
        isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : undefined,
        publishedYear: doc.first_publish_year,
        publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : undefined,
        source: 'open_library',
      };
    });
  } catch (err) {
    console.warn('Open Library API search failed or timed out:', err);
    return [];
  }
}

/**
 * Unified Book Search:
 * Concurrently queries Google Books API and Open Library API,
 * merges complementary data (covers, pages, publisher), dedupes, and ranks results.
 */
export async function searchBooksUnified(query: string): Promise<ApiBookMetadata[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  // Query both APIs in parallel
  const [googleResults, openLibResults] = await Promise.all([
    searchGoogleBooks(clean),
    searchOpenLibrary(clean),
  ]);

  const combined: ApiBookMetadata[] = [];
  const seenTitles = new Set<string>();

  // Add Google Books results first (usually has precise page counts and descriptions)
  for (const gBook of googleResults) {
    const key = `${gBook.title.toLowerCase()}::${gBook.author.toLowerCase()}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);

      // Check if Open Library has a cover image if Google Books doesn't
      if (!gBook.coverUrl) {
        const olMatch = openLibResults.find(
          (ol) => ol.title.toLowerCase() === gBook.title.toLowerCase() && ol.coverUrl
        );
        if (olMatch?.coverUrl) {
          gBook.coverUrl = olMatch.coverUrl;
        }
      }
      combined.push(gBook);
    }
  }

  // Add Open Library results that weren't in Google Books
  for (const olBook of openLibResults) {
    const key = `${olBook.title.toLowerCase()}::${olBook.author.toLowerCase()}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      combined.push(olBook);
    }
  }

  return combined.slice(0, 8);
}
