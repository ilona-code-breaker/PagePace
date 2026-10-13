/**
 * @file genreMapper.ts
 * Principal Frontend Architecture - Official API-Driven Genre Pipeline
 *
 * Architecture Principles:
 * 1. Strict 8 Macro-Genres Only:
 *    - 'Fantasy & Romantasy'
 *    - 'Sci-Fi & Dystopian'
 *    - 'Romance'
 *    - 'Historical Fiction & Classics'
 *    - 'Thriller, Mystery & Crime'
 *    - 'Horror'
 *    - 'Non-Fiction, Bio & History'
 *    - 'Graphic Novels, Manga & YA'
 *    (NO fallback buckets like 'Other' or 'Contemporary Fiction'. Unmatched metadata returns null).
 *
 * 2. Official API Field Targeting Only:
 *    - Exclusively targets Google Books `volumeInfo.categories` and Open Library `subject` / `subjects`.
 *    - No raw text scanning, titles, descriptions, or CSV metadata fields that risk trap words like "history".
 *
 * 3. Standardized Keyword Mapping:
 *    - Maps publisher and library category subjects cleanly into our 8 pillars.
 *    - Romance authors (e.g. Ali Hazelwood) categorize straight to 'Romance'.
 */

// ============================================================================
// 1. STRICT 8-PILLAR MACRO-GENRE TAXONOMY
// ============================================================================

export type MacroGenre =
  | 'Fantasy & Romantasy'
  | 'Sci-Fi & Dystopian'
  | 'Romance'
  | 'Historical Fiction & Classics'
  | 'Thriller, Mystery & Crime'
  | 'Horror'
  | 'Non-Fiction, Bio & History'
  | 'Graphic Novels, Manga & YA';

export const MACRO_GENRES: readonly MacroGenre[] = [
  'Fantasy & Romantasy',
  'Sci-Fi & Dystopian',
  'Romance',
  'Historical Fiction & Classics',
  'Thriller, Mystery & Crime',
  'Horror',
  'Non-Fiction, Bio & History',
  'Graphic Novels, Manga & YA',
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
// 2. METADATA & VISUAL PALETTE (Optimized for Recharts & Dark Mode)
// ============================================================================

export interface GenreMeta {
  genre: MacroGenre;
  color: string;
  emoji: string;
  description: string;
}

export const GENRE_METADATA: Record<MacroGenre, GenreMeta> = {
  'Fantasy & Romantasy': {
    genre: 'Fantasy & Romantasy',
    color: '#8b5cf6', // Violet
    emoji: '🗡️✨',
    description: 'Magic realms, mythical quests, folklore, and epic romantasy.',
  },
  'Sci-Fi & Dystopian': {
    genre: 'Sci-Fi & Dystopian',
    color: '#06b6d4', // Cyan
    emoji: '🚀',
    description: 'Space exploration, futuristic technology, cybernetics, and societal collapse.',
  },
  'Romance': {
    genre: 'Romance',
    color: '#ec4899', // Pink
    emoji: '💖',
    description: 'Love stories, contemporary romance, rom-coms, and relationship dynamics.',
  },
  'Historical Fiction & Classics': {
    genre: 'Historical Fiction & Classics',
    color: '#eab308', // Antique Gold
    emoji: '📜',
    description: 'Period eras, historical dramas, and foundational literary canon.',
  },
  'Thriller, Mystery & Crime': {
    genre: 'Thriller, Mystery & Crime',
    color: '#ef4444', // Red
    emoji: '🔍',
    description: 'Psychological tension, edge-of-seat twists, detectives, and investigations.',
  },
  'Horror': {
    genre: 'Horror',
    color: '#991b1b', // Blood Crimson
    emoji: '🩸',
    description: 'Gothic chills, supernatural dread, survival terror, and psychological fright.',
  },
  'Non-Fiction, Bio & History': {
    genre: 'Non-Fiction, Bio & History',
    color: '#10b981', // Emerald Green
    emoji: '🌱',
    description: 'Biographies, memoirs, true history, science, habits, and self-growth.',
  },
  'Graphic Novels, Manga & YA': {
    genre: 'Graphic Novels, Manga & YA',
    color: '#a855f7', // Vivid Purple
    emoji: '🎨',
    description: 'Comics, manga, webtoons, and coming-of-age young adult journeys.',
  },
};

// ============================================================================
// 3. OFFICIAL API CATEGORY MATCHING RULES
// ============================================================================

interface ApiCategoryRule {
  macroGenre: MacroGenre;
  patterns: RegExp[];
}

/**
 * Ordered mapping rules designed specifically for official structured API categories:
 * - Google Books volumeInfo.categories (BISAC strings e.g. "Fiction / Romance / Contemporary")
 * - Open Library subject/subjects arrays (e.g. ["Romantic fiction", "Love stories", "women in STEM"])
 *
 * Precedence note:
 * 1. Specialized Romantasy routes to 'Fantasy & Romantasy'.
 * 2. All romance, rom-com, love stories, and STEM romance route to 'Romance' (taking precedence over YA).
 * 3. Other pillars follow in order.
 */
const API_CATEGORY_RULES: readonly ApiCategoryRule[] = [
  // 1. Specialized Romantasy / Paranormal Romance -> Fantasy & Romantasy
  {
    macroGenre: 'Fantasy & Romantasy',
    patterns: [
      /\bromantasy\b/i,
      /\bparanormal\s+romance\b/i,
    ],
  },

  // 2. Romance (Contemporary, Rom-com, STEM, Love Stories, Ali Hazelwood)
  {
    macroGenre: 'Romance',
    patterns: [
      /\bromance\b/i,
      /\bromantic\b/i,
      /\blove\s+stor(y|ies)\b/i,
      /\b(rom[- ]?com|romantic\s+comedy)\b/i,
      /\bcontemporary\s+romance\b/i,
      /\bchick\s*lit\b/i,
      /\berotic\s+romance\b/i,
      /\berotica\b/i,
      /\benemies\s+to\s+lovers\b/i,
      /\bfake\s+dating\b/i,
      /\bfriends\s+to\s+lovers\b/i,
      /\bwomen\s+in\s+stem\b/i,
      /\bstem\s+romance\b/i,
      /\bali\s+hazelwood\b/i,
      /\blove\s*(&|and)\s*romance\b/i,
      /\bman[- ]woman\s+relationships\b/i,
      /\bdating\s*\(social\s*customs\)\b/i,
    ],
  },

  // 3. Fantasy & Romantasy
  {
    macroGenre: 'Fantasy & Romantasy',
    patterns: [
      /\bfantasy\b/i,
      /\bmagic(al)?\b/i,
      /\bmagical\s+realism\b/i,
      /\bwizard[s]?\b/i,
      /\bwitch(es)?\b/i,
      /\bdragon[s]?\b/i,
      /\bfae\b/i,
      /\bfaerie\b/i,
      /\bmytholog(y|ical)\b/i,
      /\bfolklore\b/i,
      /\bfairy\s*tale[s]?\b/i,
      /\bsword\s*and\s*sorcery\b/i,
      /\bhigh\s+fantasy\b/i,
      /\bepic\s+fantasy\b/i,
      /\burban\s+fantasy\b/i,
      /\bdark\s+fantasy\b/i,
    ],
  },

  // 4. Sci-Fi & Dystopian
  {
    macroGenre: 'Sci-Fi & Dystopian',
    patterns: [
      /\bscience\s+fiction\b/i,
      /\bsci[- ]?fi\b/i,
      /\bdystop(ia|ian|ias)\b/i,
      /\bspace\s+opera\b/i,
      /\b(cyberpunk|steampunk|solarpunk)\b/i,
      /\btime\s+travel\b/i,
      /\bpost[- ]apocalyptic\b/i,
      /\bapocalypt(ic|se)\b/i,
      /\bspace\s+(exploration|flight|warfare)\b/i,
      /\b(extraterrestrial|aliens?)\b/i,
    ],
  },

  // 5. Horror
  {
    macroGenre: 'Horror',
    patterns: [
      /\bhorror\b/i,
      /\bgothic\s+(fiction|horror|tales)\b/i,
      /\b(ghosts?|haunted|supernatural\s+horror|occult|vampires?|zombies?)\b/i,
      /\bpsychological\s+horror\b/i,
      /\bghost\s+stories\b/i,
    ],
  },

  // 6. Thriller, Mystery & Crime
  {
    macroGenre: 'Thriller, Mystery & Crime',
    patterns: [
      /\bthriller[s]?\b/i,
      /\bmyster(y|ies)\b/i,
      /\bdetective[s]?\b/i,
      /\bsuspense\b/i,
      /\bcrime(\s+fiction)?\b/i,
      /\bpsychological\s+thriller\b/i,
      /\bpolice\s+procedural\b/i,
      /\bmurder\s+investigation\b/i,
      /\bwhodunit\b/i,
      /\bespionage\b/i,
      /\bspy\s+fiction\b/i,
    ],
  },

  // 7. Historical Fiction & Classics
  // Strictly requires explicit genre tokens; standalone "history" or "reading history" NEVER matches here
  {
    macroGenre: 'Historical Fiction & Classics',
    patterns: [
      /\bhistorical\s+fiction\b/i,
      /\bhistorical\s+novel[s]?\b/i,
      /\bfiction\s*\/\s*historical\b/i,
      /\bclassic\s+literature\b/i,
      /\bfiction\s*\/\s*classics\b/i,
      /\bliterary\s+classics\b/i,
      /\bclassics\b/i,
      /\bvictorian(\s+period|\s+era|\s+literature)?\b/i,
      /\bregency(\s+period|\s+era)?\b/i,
      /\bancient\s+(&|and)\s+classical\b/i,
      /\bmedieval\s+fiction\b/i,
      /\breligious\s+historical\s+fiction\b/i,
    ],
  },

  // 8. Non-Fiction, Bio & History
  {
    macroGenre: 'Non-Fiction, Bio & History',
    patterns: [
      /\bnon[- ]?fiction\b/i,
      /\b(biography|biographies|autobiograph(y|ies)|memoir[s]?)\b/i,
      /\bhistory\s*\/\b/i,
      /\b(world|american|european|ancient|modern|civilization|social|military|political|cultural|natural|art)\s+history\b/i,
      /\bhistory\s+of\b/i,
      /(?<!(reading|borrow|shelf|user|loan|checkout|account|purchase)[-_ ]+)\bhistory\b/i,
      /\bself[- ]help\b/i,
      /\bpersonal\s+(growth|development)\b/i,
      /\bpsychology\b/i,
      /\bphilosophy\b/i,
      /\btrue\s+crime\b/i,
      /\b(economics|sociology|political\s+science|anthropology)\b/i,
      /\bessays\b/i,
      /\bscience\s*\/\b/i,
      /\bbusiness\s*(&|and)\s*economics\b/i,
    ],
  },

  // 9. Graphic Novels, Manga & YA
  {
    macroGenre: 'Graphic Novels, Manga & YA',
    patterns: [
      /\bgraphic\s+novel[s]?\b/i,
      /\bcomic[s]?(\s+books?)?\b/i,
      /\bmanga\b/i,
      /\bmanhwa\b/i,
      /\bwebtoon[s]?\b/i,
      /\byoung\s+adult(\s+fiction)?\b/i,
      /\b(ya\s+fiction|juvenile\s+fiction|teen\s+fiction)\b/i,
      /\bcomics\s*(&|and)\s*graphic\s*novels\b/i,
    ],
  },
] as const;

// ============================================================================
// 4. CATEGORY NORMALIZATION ENGINE
// ============================================================================

/**
 * Normalizes a single category or subject string from an official API.
 * Returns the matching MacroGenre, or null if no match.
 */
function matchCategoryString(rawCategory: string): MacroGenre | null {
  const clean = rawCategory.trim();
  if (!clean) return null;

  // Direct match if already a standard MacroGenre
  if (isMacroGenre(clean)) {
    return clean;
  }

  // Explicitly ignore CSV tracking noise or metadata tokens
  const lower = clean.toLowerCase();
  if (
    lower === 'reading history' ||
    lower === 'borrow_history' ||
    lower === 'borrow history' ||
    lower === 'shelf_history' ||
    lower === 'shelf history' ||
    lower === 'reading_history' ||
    lower === 'reading-history' ||
    lower === 'user_history' ||
    lower === 'user history' ||
    lower === 'book_history' ||
    lower === 'history tracking'
  ) {
    return null;
  }

  // Check contemporary pairing rule:
  // Goodreads/API tags containing "contemporary" paired with "romance", "love", "rom-com", or "stem"
  // route strictly to Romance.
  if (
    lower.includes('contemporary') &&
    (lower.includes('romance') ||
      lower.includes('love') ||
      lower.includes('rom-com') ||
      lower.includes('romcom') ||
      lower.includes('stem'))
  ) {
    return 'Romance';
  }

  // Iterate over API category rules in priority order
  for (const rule of API_CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(clean)) {
        return rule.macroGenre;
      }
    }
  }

  return null;
}

/**
 * Normalizes official publisher / library category strings (Google Books volumeInfo.categories
 * or Open Library subjects) into strictly one of the 8 Macro-Genres.
 *
 * Rules:
 * 1. Strict 8 Macro-Genres Only. Zero fallback category. "Other / Custom" does NOT exist.
 * 2. Official API Field Targeting Only: Looks only at structured API categories/subjects.
 * 3. If an API category/subject has no match, returns null to isolate the bug.
 *
 * @param categories Google Books volumeInfo.categories, Open Library subject(s), or single category string
 * @returns Standardized MacroGenre or null if no match found
 */
export function normalizeGenre(
  categories?: readonly string[] | string[] | string | null
): MacroGenre | null {
  if (!categories) return null;

  // Single string handling
  if (typeof categories === 'string') {
    const trimmed = categories.trim();
    if (!trimmed) return null;

    if (isMacroGenre(trimmed)) {
      return trimmed;
    }

    // Attempt to split compound category strings (e.g. separated by comma or semicolon)
    if (trimmed.includes(';') || (trimmed.includes(',') && !trimmed.includes('/'))) {
      const parts = trimmed.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        const match = matchCategoryString(part);
        if (match) return match;
      }
      return null;
    }

    return matchCategoryString(trimmed);
  }

  // Array of category strings (e.g. Google Books volumeInfo.categories or Open Library subjects)
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (typeof cat === 'string') {
        const match = matchCategoryString(cat);
        if (match) {
          return match;
        }
      }
    }
  }

  return null;
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
 * Returns an array of matched MacroGenres (deduplicated).
 * If no category matches, returns an empty array [] (zero fallback).
 *
 * @param categories Google Books volumeInfo.categories or Open Library subject(s)
 * @param options Extraction options (maxGenres limit)
 */
export function extractGenres(
  categories?: readonly string[] | string[] | string | null,
  options?: GenreExtractionOptions
): MacroGenre[] {
  if (!categories) return [];

  const matchedSet = new Set<MacroGenre>();
  const catList: string[] = Array.isArray(categories)
    ? categories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    : typeof categories === 'string' && categories.trim().length > 0
    ? [categories.trim()]
    : [];

  for (const cat of catList) {
    const match = matchCategoryString(cat);
    if (match) {
      matchedSet.add(match);
      if (options?.maxGenres && matchedSet.size >= options.maxGenres) {
        break;
      }
    }
  }

  return Array.from(matchedSet);
}

/**
 * Extracts the single primary MacroGenre from official API categories/subjects.
 * Returns null if no match is found (zero fallback).
 */
export function extractPrimaryGenre(
  categories?: readonly string[] | string[] | string | null,
  options?: GenreExtractionOptions
): MacroGenre | null {
  const genres = extractGenres(categories, options);
  return genres.length > 0 ? genres[0] : null;
}

/**
 * Formats a list of MacroGenres into a clean display label (e.g. "Fantasy & Romantasy / Romance").
 */
export function formatGenresLabel(genres: MacroGenre[]): string {
  if (!genres || genres.length === 0) return '';
  return genres.join(' / ');
}

// ============================================================================
// 5. TEST HARNESS & VERIFICATION SUITE
// ============================================================================

export interface GenreTestCase {
  name: string;
  categories: string[];
  expected: MacroGenre | null;
}

export const API_GENRE_TEST_CASES: readonly GenreTestCase[] = [
  {
    name: 'Ali Hazelwood - Google Books category (The Love Hypothesis)',
    categories: ['Fiction / Romance / Contemporary'],
    expected: 'Romance',
  },
  {
    name: 'Ali Hazelwood - Google Books category (Love on the Brain)',
    categories: ['Fiction / Romance / Romantic Comedy'],
    expected: 'Romance',
  },
  {
    name: 'Ali Hazelwood - Open Library subjects',
    categories: ['Romantic fiction', 'rom-com', 'romance', 'Contemporary Romance', 'women in STEM'],
    expected: 'Romance',
  },
  {
    name: 'Ali Hazelwood - Young Adult Contemporary Romance (Check & Mate)',
    categories: ['Young Adult Fiction / Romance / Contemporary'],
    expected: 'Romance',
  },
  {
    name: 'Romantasy priority over generic romance',
    categories: ['Fiction / Fantasy / Romantasy'],
    expected: 'Fantasy & Romantasy',
  },
  {
    name: 'Google Books Sci-Fi category (Dune)',
    categories: ['Fiction / Science Fiction / General'],
    expected: 'Sci-Fi & Dystopian',
  },
  {
    name: 'Google Books Epic Fantasy category',
    categories: ['Fiction / Fantasy / Epic'],
    expected: 'Fantasy & Romantasy',
  },
  {
    name: 'Google Books History category (Sapiens)',
    categories: ['History / Civilization'],
    expected: 'Non-Fiction, Bio & History',
  },
  {
    name: 'Google Books Biography category',
    categories: ['Biography & Autobiography / Personal Memoirs'],
    expected: 'Non-Fiction, Bio & History',
  },
  {
    name: 'Google Books Classics category (Pride and Prejudice)',
    categories: ['Fiction / Classics'],
    expected: 'Historical Fiction & Classics',
  },
  {
    name: 'Google Books Historical Fiction category',
    categories: ['Fiction / Historical / General'],
    expected: 'Historical Fiction & Classics',
  },
  {
    name: 'Google Books Thriller category',
    categories: ['Fiction / Thrillers / Suspense'],
    expected: 'Thriller, Mystery & Crime',
  },
  {
    name: 'Google Books Horror category (Dracula)',
    categories: ['Fiction / Horror'],
    expected: 'Horror',
  },
  {
    name: 'Google Books Manga category',
    categories: ['Comics & Graphic Novels / Manga / General'],
    expected: 'Graphic Novels, Manga & YA',
  },
  {
    name: 'Non-matching generic category returns null (no fallback)',
    categories: ['Fiction / General'],
    expected: null,
  },
  {
    name: 'Empty categories array returns null (no fallback)',
    categories: [],
    expected: null,
  },
  {
    name: 'Metadata trap: standalone reading history returns null',
    categories: ['reading history', 'borrow_history'],
    expected: null,
  },
  {
    name: 'Ali Hazelwood with reading history metadata resolves strictly to Romance',
    categories: ['romance', 'reading history'],
    expected: 'Romance',
  },
];

/**
 * Runs internal verification against the test harness.
 */
export function runGenreEngineSelfTest(): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const tc of API_GENRE_TEST_CASES) {
    const result = normalizeGenre(tc.categories);
    if (result !== tc.expected) {
      failures.push(
        `Test "${tc.name}" failed: expected "${tc.expected}", got "${result}"`
      );
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
