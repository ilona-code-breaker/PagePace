/**
 * @file genreMapper.ts
 * Principal Frontend Architecture - Zero-Exception 9-Pillar Macro-Genre Engine
 *
 * Requirements:
 * 1. Strict union type `MacroGenre` with exactly 9 curated categories.
 * 2. Deterministic specificity enforcement: High-intent subgenres (Sci-Fi, Romantasy, Fantasy,
 *    Thriller, Crime, Horror, History, Bio, etc.) evaluated FIRST.
 * 3. Vague token suppression: Bare noise words ("Fiction", "General", "Books", "Novel")
 *    are stripped and never cause a book to collapse into generic fiction.
 * 4. Async helper `fetchAndNormalizeGenre(title, author, existingTag?)`:
 *    Re-uses valid existing tags or fetches Google Books categories with graceful fallback
 *    to 'Literary & Contemporary Fiction'.
 */

// ============================================================================
// 1. MACRO-GENRE TAXONOMY (Strict 9-Pillar Boundaries)
// ============================================================================

export type MacroGenre =
  | 'Fantasy & Romantasy'
  | 'Sci-Fi & Dystopian'
  | 'Romance'
  | 'Historical Fiction & Classics'
  | 'Thriller, Mystery & Crime'
  | 'Horror'
  | 'Literary & Contemporary Fiction'
  | 'Non-Fiction, Bio & History'
  | 'Graphic Novels, Manga & YA';

export const MACRO_GENRES: readonly MacroGenre[] = [
  'Fantasy & Romantasy',
  'Sci-Fi & Dystopian',
  'Romance',
  'Historical Fiction & Classics',
  'Thriller, Mystery & Crime',
  'Horror',
  'Literary & Contemporary Fiction',
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
// 2. METADATA & VISUAL PALETTE (Optimized for Recharts & Tailwind)
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
    description: 'Magic realms, mythical quests, folklore, and epic romance.',
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
    description: 'Love stories, emotional journeys, rom-coms, and relationship dynamics.',
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
  'Literary & Contemporary Fiction': {
    genre: 'Literary & Contemporary Fiction',
    color: '#3b82f6', // Sapphire Blue
    emoji: '☕',
    description: 'Modern human dramas, character-driven prose, and artistic storytelling.',
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
// 3. VAGUE TOKEN SUPPRESSION
// ============================================================================

/**
 * Bare, meaningless keywords that must NEVER trigger generic fiction dumping
 * when specific subgenre keywords exist.
 */
const VAGUE_NOISE_TOKENS = new Set<string>([
  'fiction',
  'general',
  'general fiction',
  'general-fiction',
  'books',
  'book',
  'novel',
  'novels',
  'literature',
  'prose',
  'english',
  'american',
  'read',
  'to-read',
  'currently-reading',
  'favorites',
  'favourites',
  'owned',
  'owned-books',
  'books-i-own',
  'wishlist',
  'dnf',
  'did-not-finish',
  'abandoned',
  'tbr',
  'borrowed',
  'library',
  'kindle',
  'kindle-unlimited',
  'ebook',
  'e-book',
  'audiobook',
  'audible',
  'physical',
  'hardcover',
  'paperback',
  'arc',
  'reviewed',
  '5-stars',
  'all-time-favorites',
  'standalone',
  'series',
  'bestseller',
  'booktok',
  'unread',
  'uncategorized',
  'unknown',
]);

function isVagueNoiseToken(token: string): boolean {
  const clean = token.trim().toLowerCase();
  if (!clean || VAGUE_NOISE_TOKENS.has(clean)) return true;
  // Year tags like "read-in-2024", "2024-reads"
  if (/^(read-in-\d{4}|\d{4}-reads|\d{4}-books|\d{4}-tbr)$/i.test(clean)) return true;
  return false;
}

// ============================================================================
// 4. SPECIFICITY ENFORCEMENT RULES (Evaluated in Strict Priority Order)
// ============================================================================

interface SpecificityRule {
  genre: MacroGenre;
  patterns: RegExp[];
}

/**
 * Evaluated in strict priority order.
 * High-intent speculative genres (Sci-Fi, Fantasy/Romantasy) and specialty niches
 * take absolute precedence over realist and broad categories.
 */
const SPECIFICITY_RULES: SpecificityRule[] = [
  // 1. Sci-Fi & Dystopian
  {
    genre: 'Sci-Fi & Dystopian',
    patterns: [
      /\bsci[- ]?fi\b/i,
      /\bscience\s*fiction\b/i,
      /\bspace\s*opera\b/i,
      /\bcyberpunk\b/i,
      /\bsteampunk\b/i,
      /\bdystop(ia|ian)\b/i,
      /\bpost[- ]apocalyptic\b/i,
      /\bapocalypse\b/i,
      /\bapocalyptic\b/i,
      /\bhard\s*sci[- ]?fi\b/i,
      /\balien[s]?\b/i,
      /\btime\s*travel\b/i,
      /\bartificial\s*intelligence\b/i,
      /\brobot[s]?\b/i,
      /\bandroid[s]?\b/i,
      /\bspace\s*exploration\b/i,
      /\binterstellar\b/i,
      /\bcli[- ]fi\b/i,
      /\btotalitarian(ism)?\b/i,
      /\bwasteland\b/i,
      /\bsolarpunk\b/i,
    ],
  },
  // 2. Fantasy & Romantasy
  {
    genre: 'Fantasy & Romantasy',
    patterns: [
      /\bromantasy\b/i,
      /\bfantasy\s*romance\b/i,
      /\bromantic\s*fantasy\b/i,
      /\bfae\s*romance\b/i,
      /\bfantasy\b/i,
      /\bmagic(al)?\b/i,
      /\bmytholog(y|ical)\b/i,
      /\bwitch(es|craft)?\b/i,
      /\bdragon[s]?\b/i,
      /\bfae\b/i,
      /\bfaeries?\b/i,
      /\bhigh\s*fantasy\b/i,
      /\bepic\s*fantasy\b/i,
      /\bsword\s*and\s*sorcery\b/i,
      /\bgrimdark\b/i,
      /\bdark\s*fantasy\b/i,
      /\burban\s*fantasy\b/i,
      /\bcozy\s*fantasy\b/i,
      /\bsorcer(y|er)\b/i,
      /\bwizard[s]?\b/i,
    ],
  },
  // 3. Graphic Novels, Manga & YA
  {
    genre: 'Graphic Novels, Manga & YA',
    patterns: [
      /\bgraphic\s*novel[s]?\b/i,
      /\bmanga\b/i,
      /\bcomic[s]?\b/i,
      /\bwebtoon[s]?\b/i,
      /\bmanhwa\b/i,
      /\bmanhua\b/i,
      /\banime\b/i,
      /\byoung\s*adult\b/i,
      /\bya\b/i,
      /\bteen\b/i,
      /\bcoming\s*of\s*age\b/i,
      /\bjuvenile\s*fiction\b/i,
      /\bsequential\s*art\b/i,
    ],
  },
  // 4. Horror
  {
    genre: 'Horror',
    patterns: [
      /\bhorror\b/i,
      /\bgothic\s*horror\b/i,
      /\bhaunted\b/i,
      /\bghost\s*story\b/i,
      /\bbody\s*horror\b/i,
      /\bcosmic\s*horror\b/i,
      /\bpsychological\s*horror\b/i,
      /\bsupernatural\s*horror\b/i,
      /\bslasher\b/i,
      /\bvampire[s]?\b/i,
      /\bzombie[s]?\b/i,
      /\bdemon[s]?\b/i,
      /\bmacabre\b/i,
      /\bcreepy\b/i,
    ],
  },
  // 5. Thriller, Mystery & Crime
  {
    genre: 'Thriller, Mystery & Crime',
    patterns: [
      /\bthriller\b/i,
      /\bmystery\b/i,
      /\bsuspense\b/i,
      /\bcrime\b/i,
      /\btrue\s*crime\b/i,
      /\bnoir\b/i,
      /\bdetective\b/i,
      /\bwhodunit\b/i,
      /\bcozy\s*mystery\b/i,
      /\bpolice\s*procedural\b/i,
      /\bhardboiled\b/i,
      /\bpsychological\s*thriller\b/i,
      /\blegal\s*thriller\b/i,
      /\bespionage\b/i,
      /\bspy\b/i,
      /\bheist\b/i,
      /\bmafia\b/i,
      /\bmurder\s*mystery\b/i,
      /\binvestigat(ion|or)\b/i,
    ],
  },
  // 6. Romance (Prioritized with comprehensive tropes)
  {
    genre: 'Romance',
    patterns: [
      /\bromance\b/i,
      /\bcontemporary\s*romance\b/i,
      /\blove\s*story\b/i,
      /\bchick[- ]lit\b/i,
      /\bregency\s*romance\b/i,
      /\bholiday\s*romance\b/i,
      /\bsports\s*romance\b/i,
      /\brom[- ]com\b/i,
      /\benemies\s*to\s*lovers\b/i,
      /\bfake\s*dating\b/i,
      /\bsecond\s*chance\b/i,
      /\bslow\s*burn\b/i,
      /\bgrumpy\s*sunshine\b/i,
      /\bbillionaire\s*romance\b/i,
      /\bmafia\s*romance\b/i,
      /\bmarriage\s*of\s*convenience\b/i,
      /\bsteamy\b/i,
      /\bspicy\b/i,
      /\bheartwarming\s*romance\b/i,
    ],
  },
  // 7. Historical Fiction & Classics
  {
    genre: 'Historical Fiction & Classics',
    patterns: [
      /\bhistorical\s*fiction\b/i,
      /\bhistorical[- ]novel\b/i,
      /\bperiod\s*drama\b/i,
      /\bwwii\s*fiction\b/i,
      /\btudor\b/i,
      /\bregency\s*(?!romance)\b/i,
      /\bmedieval\s*fiction\b/i,
      /\bclassic[s]?\b/i,
      /\bliterary\s*classic[s]?\b/i,
      /\bvictorian\b/i,
      /\b19th\s*century\b/i,
      /\b18th\s*century\b/i,
      /\bancient\s*literature\b/i,
      /\bwestern\s*canon\b/i,
    ],
  },
  // 8. Non-Fiction, Bio & History
  {
    genre: 'Non-Fiction, Bio & History',
    patterns: [
      /\bnon[- ]fiction\b/i,
      /\bnonfiction\b/i,
      /\bbiograph(y|ies)\b/i,
      /\bautobiograph(y|ies)\b/i,
      /\bmemoir[s]?\b/i,
      /\bhistory\b/i,
      /\bworld\s*war\b/i,
      /\bwwii\b/i,
      /\bwwi\b/i,
      /\bancient\s*rome\b/i,
      /\bancient\s*greece\b/i,
      /\bmilitary\s*history\b/i,
      /\bself[- ]help\b/i,
      /\bpsychology\b/i,
      /\bproductivity\b/i,
      /\bhabit[s]?\b/i,
      /\bpersonal\s*development\b/i,
      /\bfinance\b/i,
      /\binvest(ing|ment)\b/i,
      /\bmoney\b/i,
      /\beconomics\b/i,
      /\bbusiness\b/i,
      /\bpopular\s*science\b/i,
      /\bastronomy\b/i,
      /\bastrophysics\b/i,
      /\bphysics\b/i,
      /\bbiology\b/i,
      /\bneuroscience\b/i,
      /\bphilosophy\b/i,
      /\bphilosophical\b/i,
      /\bessays?\b/i,
      /\bpoetry\b/i,
      /\bpoem[s]?\b/i,
      /\bjournalism\b/i,
    ],
  },
  // 9. Literary & Contemporary Fiction (STRICT - Only matches explicit literary tags or absolute fallback)
  {
    genre: 'Literary & Contemporary Fiction',
    patterns: [
      /\bliterary\s*fiction\b/i,
      /\blit\s*fic\b/i,
      /\bcontemporary\s*fiction\b/i,
      /\brealistic\s*fiction\b/i,
      /\bbooker\s*prize\b/i,
      /\bpulitzer\b/i,
      /\bcontemporary\s*literature\b/i,
    ],
  },
];

// ============================================================================
// 5. DETERMINISTIC TOKEN PARSING
// ============================================================================

/**
 * Tokenizes raw inputs (strings, delimited lists, stringified JSON arrays).
 * Automatically discards bare noise keywords so specific subgenres prevail.
 */
export function tokenizeRawInput(rawInput?: string | string[] | null): string[] {
  if (!rawInput) return [];

  const tokens: string[] = [];

  const addString = (val: string) => {
    if (!val || typeof val !== 'string') return;
    const trimmed = val.trim();
    if (!trimmed) return;

    // Handle stringified JSON array: '["Fantasy", "Romance"]'
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => addString(String(item)));
          return;
        }
      } catch {
        // Fall back to delimited split
      }
    }

    // Split on commas, pipes, slashes, semicolons, dashes, and newlines
    const splits = trimmed.split(/[,|/;\n\r]+/);
    for (const s of splits) {
      const clean = s.trim().toLowerCase();
      if (clean && !isVagueNoiseToken(clean)) {
        tokens.push(clean);
      }
    }
  };

  if (Array.isArray(rawInput)) {
    for (const item of rawInput) addString(item);
  } else {
    addString(rawInput);
  }

  return tokens;
}

// ============================================================================
// 6. CORE NORMALIZATION FUNCTION (normalizeGenre)
// ============================================================================

/**
 * Parses raw strings or subject arrays and deterministically resolves them into
 * exactly one of the 9 strict MacroGenre categories.
 *
 * SPECIFICITY ENFORCEMENT: High-intent subgenre terms are evaluated FIRST.
 * VAGUE TOKEN SUPPRESSION: Bare words like "Fiction" or "General" are ignored.
 *
 * @param rawInput Goodreads tags, Google Books categories, or Open Library subjects
 * @returns Standardized MacroGenre (never throws, guaranteed 1 of 9)
 *
 * @example
 * normalizeGenre("sci-fi, space opera") // 'Sci-Fi & Dystopian'
 * normalizeGenre("fantasy, romance, fae") // 'Fantasy & Romantasy'
 * normalizeGenre(["Fiction", "General", "Dystopian"]) // 'Sci-Fi & Dystopian'
 * normalizeGenre("mystery, detective, thriller") // 'Thriller, Mystery & Crime'
 * normalizeGenre("") // 'Literary & Contemporary Fiction'
 */
export function normalizeGenre(rawInput?: string | string[] | null): MacroGenre {
  if (!rawInput) {
    return 'Literary & Contemporary Fiction';
  }

  // 1. Exact MacroGenre short-circuit
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (isMacroGenre(trimmed)) {
      return trimmed;
    }
  }

  // 2. Tokenize and suppress vague noise keywords
  const tokens = tokenizeRawInput(rawInput);
  const rawString = (Array.isArray(rawInput) ? rawInput.join(' ') : String(rawInput)).toLowerCase();

  // 3. Special Combination Check: Fantasy + Romance = 'Fantasy & Romantasy'
  const hasFantasySignal = /\b(fantasy|magic|fae|dragon|witch)\b/i.test(rawString);
  const hasRomanceSignal = /\b(romance|love\s*story|rom[- ]com)\b/i.test(rawString);
  if (hasFantasySignal && hasRomanceSignal) {
    return 'Fantasy & Romantasy';
  }

  // 4. Strict Specificity Enforcement: Check specific high-intent rules in priority order
  for (const rule of SPECIFICITY_RULES) {
    // Check clean tokens first
    for (const token of tokens) {
      for (const pattern of rule.patterns) {
        if (pattern.test(token)) {
          return rule.genre;
        }
      }
    }

    // Fall back to full text match (for phrases across punctuation)
    for (const pattern of rule.patterns) {
      if (pattern.test(rawString)) {
        return rule.genre;
      }
    }
  }

  // 5. Default Fallback
  return 'Literary & Contemporary Fiction';
}

// ============================================================================
// 7. ASYNC API ENRICHMENT HELPER (fetchAndNormalizeGenre)
// ============================================================================

const apiGenreCache = new Map<string, MacroGenre>();

/**
 * Resolves a book's MacroGenre using local tags or client-side Google Books API lookup.
 *
 * 1. If `existingTag` already matches one of the 9 macro-genres, returns it immediately.
 * 2. Otherwise, queries Google Books API (`volumeInfo.categories`).
 * 3. Normalizes through `normalizeGenre()` with specificity enforcement.
 * 4. Falls back to 'Literary & Contemporary Fiction' on network error or missing data.
 *
 * @param title Book title
 * @param author Book author
 * @param existingTag Optional current genre/shelf tag
 * @returns Promise resolving to canonical MacroGenre
 */
export async function fetchAndNormalizeGenre(
  title: string,
  author = '',
  existingTag?: string
): Promise<MacroGenre> {
  // Step 1: If existing tag is already a valid MacroGenre, return immediately
  if (existingTag && isMacroGenre(existingTag.trim())) {
    return existingTag.trim() as MacroGenre;
  }

  // If existing tag has strong non-generic keywords, normalize it directly without network call
  if (existingTag && existingTag.trim()) {
    const fromExisting = normalizeGenre(existingTag);
    if (fromExisting !== 'Literary & Contemporary Fiction') {
      return fromExisting;
    }
  }

  // Check cache
  const cacheKey = `${title.trim().toLowerCase()}:::${author.trim().toLowerCase()}`;
  if (apiGenreCache.has(cacheKey)) {
    return apiGenreCache.get(cacheKey)!;
  }

  // Step 2: Query Google Books API
  try {
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();

    let query = `intitle:${encodeURIComponent(cleanTitle)}`;
    if (cleanAuthor) {
      query += `+inauthor:${encodeURIComponent(cleanAuthor)}`;
    }

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3&printType=books`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        // Inspect categories from items
        for (const item of data.items) {
          const categories: string[] | undefined = item.volumeInfo?.categories;
          if (Array.isArray(categories) && categories.length > 0) {
            const resolved = normalizeGenre(categories);
            if (resolved !== 'Literary & Contemporary Fiction') {
              apiGenreCache.set(cacheKey, resolved);
              return resolved;
            }
          }
        }

        // If categories were generic or missing, inspect description for strong signals
        for (const item of data.items) {
          const desc: string | undefined = item.volumeInfo?.description;
          if (desc && desc.length > 20) {
            const resolved = normalizeGenre(desc);
            if (resolved !== 'Literary & Contemporary Fiction') {
              apiGenreCache.set(cacheKey, resolved);
              return resolved;
            }
          }
        }
      }
    }
  } catch {
    // Network error, rate limit, or timeout: proceed to graceful fallback
  }

  // Step 3: Default fallback
  const fallback: MacroGenre = 'Literary & Contemporary Fiction';
  apiGenreCache.set(cacheKey, fallback);
  return fallback;
}

// ============================================================================
// 8. BACKWARDS COMPATIBILITY HELPERS
// ============================================================================

export interface ExtractGenreOptions {
  title?: string;
  author?: string;
  maxGenres?: number;
  fallback?: MacroGenre;
  romantasyFormat?: 'hybrid' | 'split';
  enableIntersections?: boolean;
}

export function extractGenres(
  rawInput: string | string[],
  options: ExtractGenreOptions = {}
): MacroGenre[] {
  const primary = normalizeGenre(rawInput);
  return [primary];
}

export function extractPrimaryGenre(
  rawInput: string | string[],
  fallbackOrOptions: MacroGenre | ExtractGenreOptions = 'Literary & Contemporary Fiction'
): MacroGenre {
  return normalizeGenre(rawInput);
}

export function formatGenresLabel(genres: MacroGenre[] | undefined): string {
  if (!genres || genres.length === 0) return 'Literary & Contemporary Fiction';
  return genres.join(' / ');
}

// ============================================================================
// 9. VERIFICATION TEST SUITE
// ============================================================================

export interface GenreTestCase {
  label: string;
  input: string | string[];
  expected: MacroGenre;
  explanation: string;
}

export const GENRE_TEST_CASES: GenreTestCase[] = [
  {
    label: 'Specificity: Sci-Fi with generic Fiction tags',
    input: ['Fiction', 'General', 'Science Fiction', 'Space Opera'],
    expected: 'Sci-Fi & Dystopian',
    explanation: 'Science Fiction must override vague Fiction tokens.',
  },
  {
    label: 'Specificity: Dystopian with bare novel tags',
    input: 'fiction, novel, dystopian, totalitarianism',
    expected: 'Sci-Fi & Dystopian',
    explanation: 'Dystopian must map to Sci-Fi & Dystopian.',
  },
  {
    label: 'Specificity: Fantasy + Romance intersection',
    input: 'fantasy, romance, fae, high-fantasy',
    expected: 'Fantasy & Romantasy',
    explanation: 'Fantasy and romance signals resolve into Fantasy & Romantasy.',
  },
  {
    label: 'Specificity: Pure Romance',
    input: 'contemporary romance, love story, rom-com',
    expected: 'Romance',
    explanation: 'Pure romance tags resolve into Romance.',
  },
  {
    label: 'Specificity: Historical Fiction',
    input: 'historical fiction, wwii, period drama, novel',
    expected: 'Historical Fiction & Classics',
    explanation: 'Historical fiction maps to Historical Fiction & Classics.',
  },
  {
    label: 'Specificity: Thriller & Mystery',
    input: 'fiction, mystery, psychological thriller, detective',
    expected: 'Thriller, Mystery & Crime',
    explanation: 'Thriller and mystery terms override generic fiction.',
  },
  {
    label: 'Specificity: Horror',
    input: 'gothic horror, haunted house, supernatural, books',
    expected: 'Horror',
    explanation: 'Horror maps to Horror category.',
  },
  {
    label: 'Specificity: Non-Fiction Memoir & History',
    input: 'biography, memoir, history, world war ii',
    expected: 'Non-Fiction, Bio & History',
    explanation: 'Biography and history map to Non-Fiction, Bio & History.',
  },
  {
    label: 'Specificity: Manga & YA',
    input: 'manga, shonen, young adult, comics',
    expected: 'Graphic Novels, Manga & YA',
    explanation: 'Manga and comics map to Graphic Novels, Manga & YA.',
  },
  {
    label: 'Vague Dumping Suppression Fallback',
    input: ['Fiction', 'General', 'Books', 'Literature'],
    expected: 'Literary & Contemporary Fiction',
    explanation: 'When only vague tags exist, falls back gracefully to Literary & Contemporary Fiction.',
  },
];

export function runGenreTests(): { passed: number; total: number; allPassed: boolean } {
  let passed = 0;
  for (const test of GENRE_TEST_CASES) {
    const actual = normalizeGenre(test.input);
    if (actual === test.expected) {
      passed++;
    } else {
      console.warn(`[Genre Test Failed] "${test.label}" -> Expected: ${test.expected}, Got: ${actual}`);
    }
  }

  return {
    passed,
    total: GENRE_TEST_CASES.length,
    allPassed: passed === GENRE_TEST_CASES.length,
  };
}
