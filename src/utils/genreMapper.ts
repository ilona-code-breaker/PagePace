/**
 * @file genreMapper.ts
 * Principal Frontend Architecture - Official API-Driven Multi-Genre Pipeline
 *
 * Architecture Principles:
 * 1. Strict Macro-Genres Taxonomy:
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
 *    - 'Unassigned' (Extra category for unmapped subjects or empty API payloads so users can assign their own genre)
 *
 * 2. Multi-Genre Assignment Array (MacroGenre[]):
 *    - A single book CAN and SHOULD have multiple genres assigned if multiple distinct subject
 *      signals exist in the API payload.
 *    - Example 1: ["Fantasy", "Romance", "Magic", "Fae"] -> ['Fantasy', 'Romantasy', 'Romance']
 *    - Example 2: ["Science Fiction", "Dystopian", "Classics"] -> ['Sci-Fi & Dystopian', 'Classics']
 *    - Unmapped / empty payloads -> ['Unassigned']
 *    - Deduplicated and canonically sorted.
 *
 * 3. Official API Field Targeting Only:
 *    - Exclusively targets Google Books `volumeInfo.categories` and Open Library `subject` / `subjects`.
 *    - Noise filter explicitly ignores administrative tokens like "fiction", "general",
 *      "borrow_history", "edition", "paperback", "favorites", or "read".
 */

// ============================================================================
// 1. STRICT MACRO-GENRE TAXONOMY
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
  | 'Graphic Novels, Manga'
  | 'Unassigned';

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
  'Unassigned',
] as const;

// Set for O(1) membership validation (case-insensitive aware)
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
  'Unassigned': {
    genre: 'Unassigned',
    color: '#a8a29e', // Warm stone / neutral gray
    emoji: '🏷️',
    description: 'Unassigned genre — click badge or edit book to assign a macro-genre.',
  },
  'unassigned': {
    genre: 'Unassigned',
    color: '#a8a29e',
    emoji: '🏷️',
    description: 'Unassigned genre — click badge or edit book to assign a macro-genre.',
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
]);

function isNoiseToken(str: string): boolean {
  const lower = str.trim().toLowerCase();
  if (!lower) return true;
  if (NOISE_TOKENS.has(lower)) return true;

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

const GENRE_RULES: readonly GenreRule[] = [
  // 1. Romantasy (Explicit multi-word triggers)
  {
    genre: 'Romantasy',
    patterns: [
      /\bromantasy\b/i,
      /\bfantasy[\s-_]+romance\b/i,
      /\bparanormal[\s-_]+romance\b/i,
      /\bromantic[\s-_]+fantasy\b/i,
    ],
  },

  // 2. Fantasy
  {
    genre: 'Fantasy',
    patterns: [
      /\bhigh[\s-_]+fantasy\b/i,
      /\bepic[\s-_]+fantasy\b/i,
      /\burgent[\s-_]+fantasy\b/i,
      /\burban[\s-_]+fantasy\b/i,
      /\bfantasy\b/i,
      /\bmagic(al)?\b/i,
      /\bfae\b/i,
      /\bfaerie[s]?\b/i,
      /\bwitch(es)?\b/i,
      /\bdragon[s]?\b/i,
      /\bmytholog(y|ical)\b/i,
      /\bfolklore\b/i,
    ],
  },

  // 3. Sci-Fi & Dystopian
  {
    genre: 'Sci-Fi & Dystopian',
    patterns: [
      /\bscience[\s-_]+fiction\b/i,
      /\bsci[-_ ]?fi\b/i,
      /\bscifi\b/i,
      /\bdystop(ia|ian|ias)\b/i,
      /\bcyberpunk\b/i,
      /\bspace[\s-_]+opera\b/i,
      /\bpost[-_ ]apocalyptic\b/i,
      /\btime[\s-_]+travel\b/i,
      /\balien[s]?\b/i,
      /\bsteampunk\b/i,
      /\bapocalyptic\b/i,
    ],
  },

  // 4. Romance
  {
    genre: 'Romance',
    patterns: [
      /\bcontemporary[\s-_]+romance\b/i,
      /\blove[\s-_]+stor(y|ies)\b/i,
      /\b(rom[-_ ]?com|romantic[\s-_]+comedy)\b/i,
      /\bromance\b/i,
      /\bromantic\b/i,
      /\bchick[\s-_]+lit\b/i,
      /\bnew[\s-_]+adult\b/i,
    ],
  },

  // 5. Young Adult
  {
    genre: 'Young Adult',
    patterns: [
      /\byoung[\s-_]+adult\b/i,
      /\bya\b/i,
      /\bteen[s]?\b/i,
      /\bcoming[\s-_]+of[\s-_]+age\b/i,
      /\bjuvenile\b/i,
    ],
  },

  // 6. Historical Fiction
  {
    genre: 'Historical Fiction',
    patterns: [
      /\bhistorical[\s-_]+fiction\b/i,
      /\bhistorical\b/i,
      /\bperiod[\s-_]+drama\b/i,
      /\bwwii\b/i,
      /\bworld[\s-_]+war[\s-_]+(ii|2|1|i)\b/i,
      /\bvictorian\b/i,
      /\bregency\b/i,
      /\btudor\b/i,
      /\bmedieval\b/i,
      /\brenaissance\b/i,
    ],
  },

  // 7. Classics
  {
    genre: 'Classics',
    patterns: [
      /\bclassic[\s-_]+literature\b/i,
      /\bliterary[\s-_]+classics\b/i,
      /\bclassics\b/i,
      /\bclassic\b/i,
    ],
  },

  // 8. Thriller, Mystery & Crime
  {
    genre: 'Thriller, Mystery & Crime',
    patterns: [
      /\btrue[\s-_]+crime\b/i,
      /\bthriller[s]?\b/i,
      /\bmyster(y|ies)\b/i,
      /\bcrime\b/i,
      /\bsuspense\b/i,
      /\bdetective[s]?\b/i,
      /\bnoir\b/i,
      /\bespionage\b/i,
      /\bcozy[\s-_]+mystery\b/i,
      /\bpsychological[\s-_]+thriller\b/i,
      /\binvestigation\b/i,
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
      /\boccult\b/i,
      /\bparanormal(?![\s-_]+romance)\b/i,
      /\bghost[s]?\b/i,
      /\bvampire[s]?\b/i,
      /\bzombie[s]?\b/i,
    ],
  },

  // 10. Non-Fiction, Bio & History
  {
    genre: 'Non-Fiction, Bio & History',
    patterns: [
      /\bnon[-_ ]?fiction\b/i,
      /\b(biograph(y|ies)|autobiograph(y|ies)|memoir[s]?)\b/i,
      /(?<!(reading|borrow|shelf|user|loan|checkout|account|purchase)[-_ ]+)\bhistory\b/i,
      /\bpsychology\b/i,
      /\bself[-_ ]help\b/i,
      /\bscience\b(?![\s-_]*fiction)/i,
      /\bphilosophy\b/i,
      /\bpolitics\b/i,
      /\beconomics\b/i,
      /\bbusiness\b/i,
      /\btrue[\s-_]+story\b/i,
    ],
  },

  // 11. Graphic Novels, Manga
  {
    genre: 'Graphic Novels, Manga',
    patterns: [
      /\bgraphic[\s-_]+novel[s]?\b/i,
      /\bmanga\b/i,
      /\bcomic[s]?\b/i,
      /\bcomic[\s-_]+book[s]?\b/i,
      /\bwebtoon[s]?\b/i,
      /\bmanhwa\b/i,
      /\bgraphic[\s-_]+memoir\b/i,
    ],
  },

  // 12. Explicit Unassigned / Uncategorized tags
  {
    genre: 'Unassigned',
    patterns: [
      /\bunassigned\b/i,
      /\buncategorized\b/i,
      /\bno[-_ ]?genre\b/i,
    ],
  },
] as const;

// ============================================================================
// 5. MULTI-GENRE NORMALIZATION PIPELINE
// ============================================================================

export interface NormalizeGenreOptions {
  /** If true (default), returns ['Unassigned'] when zero genres match */
  fallbackToUnassigned?: boolean;
}

/**
 * Normalizes raw `subjects` (from Open Library API) and `categories` (from Google Books API)
 * into a deduplicated array of target genres (`MacroGenre[]`).
 *
 * Rules:
 * 1. Multi-Genre Array: If multiple distinct signals exist, returns all matched MacroGenres.
 *    Example 1: ["Fantasy", "Romance", "Magic", "Fae"] -> ['Fantasy', 'Romantasy', 'Romance']
 *    Example 2: ["Science Fiction", "Dystopian", "Classics"] -> ['Sci-Fi & Dystopian', 'Classics']
 * 2. Unmapped subjects or empty API payloads return as extra category "Unassigned" so the user
 *    can reassign the genre later.
 * 3. Deduplicated and canonically ordered.
 *
 * @param categories Google Books volumeInfo.categories, Open Library subjects, or single category string
 * @param options Configuration options
 * @returns Array of deduplicated MacroGenres (or ['Unassigned'] if no matches)
 */
export function normalizeGenres(
  categories?: readonly string[] | string[] | string | null,
  options?: NormalizeGenreOptions
): MacroGenre[] {
  const fallbackToUnassigned = options?.fallbackToUnassigned ?? true;

  if (!categories) {
    return fallbackToUnassigned ? ['Unassigned'] : [];
  }

  const rawList: string[] = [];
  const inputList: string[] = [];

  if (Array.isArray(categories)) {
    for (const c of categories) {
      if (typeof c === 'string' && c.trim().length > 0) {
        inputList.push(c.trim());
      }
    }
  } else if (typeof categories === 'string') {
    const trimmed = categories.trim();
    if (trimmed.length > 0) {
      inputList.push(trimmed);
    }
  }

  for (const item of inputList) {
    // Strip Goodreads position markers like "fantasy (#1)" -> "fantasy"
    const cleaned = item.replace(/\s*\(\s*#\d+\s*\)/g, '').trim();
    if (!cleaned) continue;

    // Split by comma or semicolon if not a hierarchical slash path like "Fiction / Historical"
    if (cleaned.includes(';') || (cleaned.includes(',') && !cleaned.includes('/'))) {
      const parts = cleaned
        .split(/[;,]/)
        .map((s) => s.replace(/\s*\(\s*#\d+\s*\)/g, '').trim())
        .filter(Boolean);
      rawList.push(...parts);
    } else {
      rawList.push(cleaned);
    }
  }

  if (rawList.length === 0) {
    return fallbackToUnassigned ? ['Unassigned'] : [];
  }

  const matchedSet = new Set<MacroGenre>();

  for (const raw of rawList) {
    const clean = raw.trim();
    if (!clean) continue;

    // Direct match for unassigned string (case-insensitive)
    if (clean.toLowerCase() === 'unassigned') {
      matchedSet.add('Unassigned');
      continue;
    }

    const tokensToTest = clean.includes('/')
      ? [clean, ...clean.split('/').map((s) => s.trim()).filter(Boolean)]
      : [clean];

    for (const token of tokensToTest) {
      // 1. Noise Protection
      if (isNoiseToken(token)) {
        continue;
      }

      // 2. Direct match
      if (isMacroGenre(token)) {
        matchedSet.add(token);
      }

      // 3. Scan against keyword mapping dictionary
      for (const rule of GENRE_RULES) {
        for (const pattern of rule.patterns) {
          if (pattern.test(token)) {
            matchedSet.add(rule.genre);
            break;
          }
        }
      }
    }
  }

  // 4. Romantasy Synthesis (Example 1)
  if (matchedSet.has('Fantasy') && matchedSet.has('Romance')) {
    matchedSet.add('Romantasy');
  }

  // 5. If no target genre matched from the API payload, return ['Unassigned']
  if (matchedSet.size === 0) {
    return fallbackToUnassigned ? ['Unassigned'] : [];
  }

  // If specific target genres matched, exclude 'Unassigned' so it doesn't pollute concrete genres
  if (matchedSet.size > 1 && matchedSet.has('Unassigned')) {
    matchedSet.delete('Unassigned');
  }

  // 6. Return in deterministic canonical order
  return MACRO_GENRES.filter((g) => matchedSet.has(g));
}

export interface GenreExtractionOptions extends NormalizeGenreOptions {
  maxGenres?: number;
  /** @deprecated Metadata string-scanning is removed */
  title?: string;
  /** @deprecated Metadata string-scanning is removed */
  author?: string;
}

export function extractGenres(
  categories?: readonly string[] | string[] | string | null,
  options?: GenreExtractionOptions
): MacroGenre[] {
  const genres = normalizeGenres(categories, options);
  if (options?.maxGenres && genres.length > options.maxGenres) {
    return genres.slice(0, options.maxGenres);
  }
  return genres;
}

export function normalizeGenre(
  categories?: readonly string[] | string[] | string | null,
  options?: NormalizeGenreOptions
): MacroGenre {
  const genres = normalizeGenres(categories, options);
  return genres.length > 0 ? genres[0] : 'Unassigned';
}

export function extractPrimaryGenre(
  categories?: readonly string[] | string[] | string | null,
  options?: GenreExtractionOptions
): MacroGenre {
  const genres = extractGenres(categories, options);
  return genres.length > 0 ? genres[0] : 'Unassigned';
}

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
    name: 'Unmapped subjects return extra category "Unassigned"',
    categories: ['Fiction / General'],
    expected: ['Unassigned'],
  },
  {
    name: 'Empty categories array returns "Unassigned"',
    categories: [],
    expected: ['Unassigned'],
  },
  {
    name: 'Metadata trap: standalone reading history returns "Unassigned"',
    categories: ['reading history', 'borrow_history'],
    expected: ['Unassigned'],
  },
  {
    name: 'Ali Hazelwood with reading history metadata resolves strictly to Romance',
    categories: ['romance', 'reading history'],
    expected: ['Romance'],
  },
];

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
