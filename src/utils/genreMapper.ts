/**
 * @file genreMapper.ts
 * Principal Frontend Architecture - Official API-Driven Multi-Genre Pipeline
 *
 * Architecture Principles:
 * 1. Strict 11 Macro-Genres Only:
 *    - 'Fantasy'
 *    - 'Romantasy'
 *    - 'Sci-Fi & Dystopian'
 *    - 'Romance'
 *    - 'Young Adult'
 *    - 'Historical Fiction'
 *    - 'Classics'
 *    - 'Thriller, Mystery & Crime'
 *    - 'Horror'
 *    - 'Non-Fiction, Bio & History'
 *    - 'Graphic Novels, Manga'
 *    (NO fallback buckets like 'Other' or 'Contemporary Fiction'. Unmapped metadata returns [] / null).
 *
 * 2. Multi-Genre Assignment Array (MacroGenre[]):
 *    - A single book CAN and SHOULD have multiple genres assigned if multiple distinct subject
 *      signals exist in the API payload.
 *    - Example 1: ["Fantasy", "Romance", "Magic", "Fae"] -> ['Fantasy', 'Romantasy', 'Romance']
 *    - Example 2: ["Science Fiction", "Dystopian", "Classics"] -> ['Sci-Fi & Dystopian', 'Classics']
 *    - Deduplicated and canonically sorted.
 *
 * 3. Official API Field Targeting Only:
 *    - Exclusively targets Google Books `volumeInfo.categories` and Open Library `subject` / `subjects`.
 *    - Noise filter explicitly ignores administrative tokens like "fiction", "general",
 *      "borrow_history", "edition", "paperback", "favorites", or "read".
 */

// ============================================================================
// 1. STRICT 11-PILLAR MACRO-GENRE TAXONOMY
// ============================================================================

export type MacroGenre =
  | 'Fantasy'
  | 'Romantasy'
  | 'Sci-Fi & Dystopian'
  | 'Romance'
  | 'Young Adult'
  | 'Historical Fiction'
  | 'Classics'
  | 'Thriller, Mystery & Crime'
  | 'Horror'
  | 'Non-Fiction, Bio & History'
  | 'Graphic Novels, Manga';

export const MACRO_GENRES: readonly MacroGenre[] = [
  'Fantasy',
  'Romantasy',
  'Sci-Fi & Dystopian',
  'Romance',
  'Young Adult',
  'Historical Fiction',
  'Classics',
  'Thriller, Mystery & Crime',
  'Horror',
  'Non-Fiction, Bio & History',
  'Graphic Novels, Manga',
] as const;

// Set for O(1) membership validation
const MACRO_GENRE_SET: ReadonlySet<string> = new Set<string>(MACRO_GENRES);

export function isMacroGenre(value: unknown): value is MacroGenre {
  return typeof value === 'string' && MACRO_GENRE_SET.has(value);
}

// Backwards compatibility aliases
export type MasterGenre = MacroGenre;
export const MASTER_GENRES = MACRO_GENRES;
export const isMasterGenre = isMacroGenre;

// ============================================================================
// 2. METADATA & VISUAL PALETTE (Optimized for Recharts, Badges & Dark Mode)
// ============================================================================

export interface GenreMeta {
  genre: MacroGenre;
  color: string;
  emoji: string;
  description: string;
}

export const GENRE_METADATA: Record<string, GenreMeta> = {
  'Fantasy': {
    genre: 'Fantasy',
    color: '#8b5cf6', // Violet
    emoji: '🧙‍♂️✨',
    description: 'Magic realms, mythical quests, witches, dragons, and high epic fantasy.',
  },
  'Romantasy': {
    genre: 'Romantasy',
    color: '#ec4899', // Pink / Fuchsia
    emoji: '⚔️💖',
    description: 'Fae romance, romantic fantasy, and passionate paranormal quests.',
  },
  'Sci-Fi & Dystopian': {
    genre: 'Sci-Fi & Dystopian',
    color: '#06b6d4', // Cyan
    emoji: '🚀',
    description: 'Space opera, futuristic tech, cyberpunk, and dystopian futures.',
  },
  'Romance': {
    genre: 'Romance',
    color: '#f43f5e', // Rose
    emoji: '💖',
    description: 'Love stories, contemporary romance, rom-coms, and relationship dynamics.',
  },
  'Young Adult': {
    genre: 'Young Adult',
    color: '#f97316', // Orange
    emoji: '🎒',
    description: 'Coming-of-age journeys, teen dilemmas, and young adult adventures.',
  },
  'Historical Fiction': {
    genre: 'Historical Fiction',
    color: '#d97706', // Warm Amber
    emoji: '⏳',
    description: 'Period dramas, Victorian sagas, WWII, and historical epochs.',
  },
  'Classics': {
    genre: 'Classics',
    color: '#eab308', // Antique Gold
    emoji: '📜',
    description: 'Enduring literary masterpieces and foundational classic literature.',
  },
  'Thriller, Mystery & Crime': {
    genre: 'Thriller, Mystery & Crime',
    color: '#ef4444', // Red
    emoji: '🔍',
    description: 'Psychological tension, edge-of-seat twists, detectives, and true crime.',
  },
  'Horror': {
    genre: 'Horror',
    color: '#991b1b', // Blood Crimson
    emoji: '🩸',
    description: 'Gothic chills, supernatural dread, haunted spirits, and spooky terror.',
  },
  'Non-Fiction, Bio & History': {
    genre: 'Non-Fiction, Bio & History',
    color: '#10b981', // Emerald Green
    emoji: '🌱',
    description: 'Biographies, memoirs, true history, psychology, self-help, and philosophy.',
  },
  'Graphic Novels, Manga': {
    genre: 'Graphic Novels, Manga',
    color: '#a855f7', // Vivid Purple
    emoji: '🎨',
    description: 'Manga, graphic novels, comic books, and webtoons.',
  },
  // Legacy aliases for backward compatibility with previously stored books
  'Fantasy & Romantasy': {
    genre: 'Fantasy',
    color: '#8b5cf6',
    emoji: '🧙‍♂️✨',
    description: 'Magic realms, mythical quests, and epic fantasy.',
  },
  'Historical Fiction & Classics': {
    genre: 'Historical Fiction',
    color: '#d97706',
    emoji: '⏳',
    description: 'Period dramas and classic literature.',
  },
  'Graphic Novels, Manga & YA': {
    genre: 'Graphic Novels, Manga',
    color: '#a855f7',
    emoji: '🎨',
    description: 'Comics, manga, and graphic novels.',
  },
};

// ============================================================================
// 3. NOISE & METADATA PROTECTION
// ============================================================================

/**
 * Broad administrative tokens and tracking noise that must NEVER trigger genres.
 */
const NOISE_TOKENS: ReadonlySet<string> = new Set([
  'fiction',
  'general',
  'borrow_history',
  'borrow history',
  'borrow-history',
  'reading history',
  'reading_history',
  'reading-history',
  'shelf_history',
  'shelf history',
  'shelf-history',
  'user_history',
  'user history',
  'book_history',
  'history tracking',
  'edition',
  'paperback',
  'hardcover',
  'favorites',
  'read',
  'currently-reading',
  'to-read',
  'owned',
  'books',
  'default',
  'unclassified',
]);

/**
 * Checks if a string is administrative metadata noise.
 */
function isNoiseToken(str: string): boolean {
  const lower = str.trim().toLowerCase();
  if (!lower) return true;
  if (NOISE_TOKENS.has(lower)) return true;

  // Normalized alphanumeric check (e.g. "borrow_history" -> "borrowhistory")
  const stripped = lower.replace(/[-_ ]/g, '');
  if (
    stripped === 'borrowhistory' ||
    stripped === 'readinghistory' ||
    stripped === 'shelfhistory' ||
    stripped === 'userhistory' ||
    stripped === 'bookhistory'
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// 4. SUBSTRING & KEYWORD MAPPING DICTIONARY
// ============================================================================

interface GenreRule {
  genre: MacroGenre;
  patterns: RegExp[];
}

/**
 * Case-insensitive regex patterns matching the exact dictionary triggers specified:
 * - Fantasy: "fantasy", "magic", "fae", "witches", "dragons", "high fantasy", "epic fantasy"
 * - Romantasy: "romantasy", "fantasy romance", "paranormal romance", "romantic fantasy"
 * - Sci-Fi & Dystopian: "science fiction", "sci-fi", "scifi", "dystopian", "dystopia", "cyberpunk", "space opera", "post-apocalyptic", "time travel"
 * - Romance: "romance", "romantic", "love story", "contemporary romance", "rom-com", "romcom"
 * - Young Adult: "young adult", "ya", "teen", "coming of age"
 * - Historical Fiction: "historical fiction", "historical", "period drama", "wwii", "victorian"
 * - Classics: "classics", "classic literature", "literary classics"
 * - Thriller, Mystery & Crime: "thriller", "mystery", "crime", "suspense", "detective", "noir", "true crime"
 * - Horror: "horror", "gothic", "supernatural", "haunted", "spooky"
 * - Non-Fiction, Bio & History: "non-fiction", "nonfiction", "biography", "autobiography", "memoir", "history", "psychology", "self-help", "science", "philosophy"
 * - Graphic Novels, Manga: "manga", "graphic novel", "comic", "comics", "webtoon"
 */
const GENRE_RULES: readonly GenreRule[] = [
  // 1. Romantasy (Explicit multi-word triggers)
  {
    genre: 'Romantasy',
    patterns: [
      /\bromantasy\b/i,
      /\bfantasy\s+romance\b/i,
      /\bparanormal\s+romance\b/i,
      /\bromantic\s+fantasy\b/i,
    ],
  },

  // 2. Fantasy
  {
    genre: 'Fantasy',
    patterns: [
      /\bhigh\s+fantasy\b/i,
      /\bepic\s+fantasy\b/i,
      /\bfantasy\b/i,
      /\bmagic(al)?\b/i,
      /\bfae\b/i,
      /\bfaerie[s]?\b/i,
      /\bwitch(es)?\b/i,
      /\bdragon[s]?\b/i,
    ],
  },

  // 3. Sci-Fi & Dystopian
  {
    genre: 'Sci-Fi & Dystopian',
    patterns: [
      /\bscience\s+fiction\b/i,
      /\bsci[- ]?fi\b/i,
      /\bscifi\b/i,
      /\bdystop(ia|ian|ias)\b/i,
      /\bcyberpunk\b/i,
      /\bspace\s+opera\b/i,
      /\bpost[- ]apocalyptic\b/i,
      /\btime\s+travel\b/i,
    ],
  },

  // 4. Romance
  {
    genre: 'Romance',
    patterns: [
      /\bcontemporary\s+romance\b/i,
      /\blove\s+stor(y|ies)\b/i,
      /\b(rom[- ]?com|romantic\s+comedy)\b/i,
      /\bromance\b/i,
      /\bromantic\b/i,
    ],
  },

  // 5. Young Adult
  {
    genre: 'Young Adult',
    patterns: [
      /\byoung\s+adult\b/i,
      /\bya\b/i,
      /\bteen[s]?\b/i,
      /\bcoming\s+of\s+age\b/i,
    ],
  },

  // 6. Historical Fiction
  {
    genre: 'Historical Fiction',
    patterns: [
      /\bhistorical\s+fiction\b/i,
      /\bhistorical\b/i,
      /\bperiod\s+drama\b/i,
      /\bwwii\b/i,
      /\bworld\s+war\s+(ii|2)\b/i,
      /\bvictorian\b/i,
    ],
  },

  // 7. Classics
  {
    genre: 'Classics',
    patterns: [
      /\bclassic\s+literature\b/i,
      /\bliterary\s+classics\b/i,
      /\bclassics\b/i,
    ],
  },

  // 8. Thriller, Mystery & Crime
  {
    genre: 'Thriller, Mystery & Crime',
    patterns: [
      /\btrue\s+crime\b/i,
      /\bthriller[s]?\b/i,
      /\bmyster(y|ies)\b/i,
      /\bcrime\b/i,
      /\bsuspense\b/i,
      /\bdetective[s]?\b/i,
      /\bnoir\b/i,
    ],
  },

  // 9. Horror
  {
    genre: 'Horror',
    patterns: [
      /\bhorror\b/i,
      /\bgothic\b/i,
      /\bsupernatural\b/i,
      /\bhaunted\b/i,
      /\bspooky\b/i,
    ],
  },

  // 10. Non-Fiction, Bio & History
  // Safeguards:
  // - history does not match reading history / borrow history
  // - science does not match "science fiction"
  {
    genre: 'Non-Fiction, Bio & History',
    patterns: [
      /\bnon[- ]?fiction\b/i,
      /\b(biograph(y|ies)|autobiograph(y|ies)|memoir[s]?)\b/i,
      /(?<!(reading|borrow|shelf|user|loan|checkout|account|purchase)[-_ ]+)\bhistory\b/i,
      /\bpsychology\b/i,
      /\bself[- ]help\b/i,
      /\bscience\b(?!\s*fiction)/i,
      /\bphilosophy\b/i,
    ],
  },

  // 11. Graphic Novels, Manga
  {
    genre: 'Graphic Novels, Manga',
    patterns: [
      /\bgraphic\s+novel[s]?\b/i,
      /\bmanga\b/i,
      /\bcomic[s]?\b/i,
      /\bwebtoon[s]?\b/i,
    ],
  },
] as const;

// ============================================================================
// 5. MULTI-GENRE NORMALIZATION PIPELINE
// ============================================================================

/**
 * Normalizes raw `subjects` (from Open Library API) and `categories` (from Google Books API)
 * into a deduplicated array of our exact 11 target genres (`MacroGenre[]`).
 *
 * Rules:
 * 1. Strict 11 Macro-Genres. Zero fallback category. "Other / Custom" does NOT exist.
 * 2. Multi-Genre Array: If multiple distinct signals exist, returns all matched MacroGenres.
 *    Example 1: ["Fantasy", "Romance", "Magic", "Fae"] -> ['Fantasy', 'Romantasy', 'Romance']
 *    Example 2: ["Science Fiction", "Dystopian", "Classics"] -> ['Sci-Fi & Dystopian', 'Classics']
 * 3. Deduplicated and canonically ordered.
 * 4. Zero fallback: If zero subjects match any target genre, returns an empty array `[]`.
 *
 * @param categories Google Books volumeInfo.categories, Open Library subjects, or single category string
 * @returns Array of deduplicated MacroGenres, or empty array [] if no match
 */
export function normalizeGenres(
  categories?: readonly string[] | string[] | string | null
): MacroGenre[] {
  if (!categories) return [];

  // Flatten input into array of strings
  let rawList: string[] = [];
  if (Array.isArray(categories)) {
    rawList = categories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
  } else if (typeof categories === 'string') {
    const trimmed = categories.trim();
    if (!trimmed) return [];
    // If separated by semicolon or comma (e.g. "Fantasy, Romance")
    if (trimmed.includes(';') || (trimmed.includes(',') && !trimmed.includes('/'))) {
      rawList = trimmed.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    } else {
      rawList = [trimmed];
    }
  }

  if (rawList.length === 0) return [];

  const matchedSet = new Set<MacroGenre>();

  for (const raw of rawList) {
    const clean = raw.trim();
    if (!clean) continue;

    // 1. Noise Protection: ignore administrative tokens and history tracking noise
    if (isNoiseToken(clean)) {
      continue;
    }

    // 2. Direct match if exact target MacroGenre
    if (isMacroGenre(clean)) {
      matchedSet.add(clean);
    }

    // 3. Scan against keyword mapping dictionary
    for (const rule of GENRE_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(clean)) {
          matchedSet.add(rule.genre);
          break; // move to next rule once this genre matches this string
        }
      }
    }
  }

  // 4. Romantasy Synthesis:
  // If distinct subject signals for Fantasy (or magic/fae) and Romance co-exist,
  // ensure 'Romantasy' is included (as illustrated in Example 1).
  if (matchedSet.has('Fantasy') && matchedSet.has('Romance')) {
    matchedSet.add('Romantasy');
  }

  // 5. Canonical ordering (deterministic presentation)
  return MACRO_GENRES.filter((g) => matchedSet.has(g));
}

export interface GenreExtractionOptions {
  maxGenres?: number;
  /** @deprecated Metadata string-scanning is removed; only official API categories/subjects are parsed */
  title?: string;
  /** @deprecated Metadata string-scanning is removed; only official API categories/subjects are parsed */
  author?: string;
}

/**
 * Extracts all matching MacroGenres from official API category/subject strings.
 * Alias of `normalizeGenres`, supporting optional `maxGenres` limit.
 */
export function extractGenres(
  categories?: readonly string[] | string[] | string | null,
  options?: GenreExtractionOptions
): MacroGenre[] {
  const genres = normalizeGenres(categories);
  if (options?.maxGenres && genres.length > options.maxGenres) {
    return genres.slice(0, options.maxGenres);
  }
  return genres;
}

/**
 * Normalizes official publisher / library category strings into a single primary MacroGenre.
 * Provided for backwards compatibility with single-genre consumers.
 * Returns null if no match found (zero fallback bucket).
 */
export function normalizeGenre(
  categories?: readonly string[] | string[] | string | null
): MacroGenre | null {
  const genres = normalizeGenres(categories);
  return genres.length > 0 ? genres[0] : null;
}

/**
 * Extracts the single primary MacroGenre from official API categories/subjects.
 * Returns null if no match is found (zero fallback bucket).
 */
export function extractPrimaryGenre(
  categories?: readonly string[] | string[] | string | null,
  options?: GenreExtractionOptions
): MacroGenre | null {
  const genres = extractGenres(categories, options);
  return genres.length > 0 ? genres[0] : null;
}

/**
 * Formats a list of MacroGenres into a clean display label (e.g. "Fantasy / Romantasy / Romance").
 */
export function formatGenresLabel(genres: MacroGenre[]): string {
  if (!genres || genres.length === 0) return '';
  return genres.join(' / ');
}

// ============================================================================
// 6. TEST HARNESS & VERIFICATION SUITE
// ============================================================================

export interface MultiGenreTestCase {
  name: string;
  categories: string[];
  expected: MacroGenre[];
}

export const API_GENRE_TEST_CASES: readonly MultiGenreTestCase[] = [
  {
    name: 'Example 1: Multi-genre with Fantasy, Romance, Magic, Fae -> Fantasy, Romantasy, Romance',
    categories: ['Fantasy', 'Romance', 'Magic', 'Fae'],
    expected: ['Fantasy', 'Romantasy', 'Romance'],
  },
  {
    name: 'Example 2: Multi-genre with Science Fiction, Dystopian, Classics -> Sci-Fi & Dystopian, Classics',
    categories: ['Science Fiction', 'Dystopian', 'Classics'],
    expected: ['Sci-Fi & Dystopian', 'Classics'],
  },
  {
    name: 'Ali Hazelwood - Google Books category (The Love Hypothesis)',
    categories: ['Fiction / Romance / Contemporary'],
    expected: ['Romance'],
  },
  {
    name: 'Ali Hazelwood - Google Books category (Love on the Brain)',
    categories: ['Fiction / Romance / Romantic Comedy'],
    expected: ['Romance'],
  },
  {
    name: 'Ali Hazelwood - Open Library subjects',
    categories: ['Romantic fiction', 'rom-com', 'romance', 'Contemporary Romance'],
    expected: ['Romance'],
  },
  {
    name: 'Ali Hazelwood - Young Adult Contemporary Romance (Check & Mate)',
    categories: ['Young Adult Fiction / Romance / Contemporary'],
    expected: ['Romance', 'Young Adult'],
  },
  {
    name: 'Explicit Romantasy category',
    categories: ['Fiction / Romantasy'],
    expected: ['Romantasy'],
  },
  {
    name: 'Google Books Sci-Fi category (Dune)',
    categories: ['Fiction / Science Fiction / General'],
    expected: ['Sci-Fi & Dystopian'],
  },
  {
    name: 'Google Books Epic Fantasy category',
    categories: ['Fiction / Fantasy / Epic'],
    expected: ['Fantasy'],
  },
  {
    name: 'Google Books History category (Sapiens)',
    categories: ['History / Civilization'],
    expected: ['Non-Fiction, Bio & History'],
  },
  {
    name: 'Google Books Biography category',
    categories: ['Biography & Autobiography / Personal Memoirs'],
    expected: ['Non-Fiction, Bio & History'],
  },
  {
    name: 'Google Books Classics category (Pride and Prejudice)',
    categories: ['Fiction / Classics'],
    expected: ['Classics'],
  },
  {
    name: 'Google Books Historical Fiction category',
    categories: ['Fiction / Historical / General'],
    expected: ['Historical Fiction'],
  },
  {
    name: 'Google Books Thriller category',
    categories: ['Fiction / Thrillers / Suspense'],
    expected: ['Thriller, Mystery & Crime'],
  },
  {
    name: 'Google Books Horror category (Dracula)',
    categories: ['Fiction / Horror'],
    expected: ['Horror'],
  },
  {
    name: 'Google Books Manga category',
    categories: ['Comics & Graphic Novels / Manga / General'],
    expected: ['Graphic Novels, Manga'],
  },
  {
    name: 'Non-matching generic category returns empty array (no fallback)',
    categories: ['Fiction / General'],
    expected: [],
  },
  {
    name: 'Empty categories array returns empty array (no fallback)',
    categories: [],
    expected: [],
  },
  {
    name: 'Metadata trap: standalone reading history returns empty array',
    categories: ['reading history', 'borrow_history'],
    expected: [],
  },
  {
    name: 'Ali Hazelwood with reading history metadata resolves strictly to Romance',
    categories: ['romance', 'reading history'],
    expected: ['Romance'],
  },
];

/**
 * Runs internal verification against the test harness.
 */
export function runGenreEngineSelfTest(): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const tc of API_GENRE_TEST_CASES) {
    const result = normalizeGenres(tc.categories);
    const matches =
      result.length === tc.expected.length &&
      result.every((g, i) => g === tc.expected[i]);

    if (!matches) {
      failures.push(
        `Test "${tc.name}" failed: expected [${tc.expected.join(', ')}], got [${result.join(', ')}]`
      );
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
