/**
 * @file genreMapper.ts
 * Principal Frontend Architecture - High-Intent Genre Mapping & Intersection Engine
 *
 * Solves the "Lazy Fiction Fallback" problem:
 * 1. Strict elimination of broad catch-alls ("Contemporary Fiction", "General Fiction").
 * 2. High-Intent Priority hierarchy: Specific subgenres (Sci-Fi, Dystopian, Romantasy, Fantasy, etc.)
 *    always decisively overpower generic "Fiction" and "Literature" noise tags.
 * 3. Iconic Landmark Knowledge Grounding: Recognizes seminal titles/authors (e.g. *Dune* -> Science Fiction,
 *    *1984* -> Dystopian & Post-Apocalyptic + Classics) even when metadata tags are sparse or messy.
 * 4. Strict Primary + Secondary tuple array: Exactly 1 to 2 distinct MasterGenres [primaryGenre, secondaryGenre?].
 * 5. First-class Romantasy support: Recognizes Fantasy + Romance intersections as 'Romantasy'
 *    (or split format ['Fantasy', 'Romance'] when requested).
 * 6. Hard fallback to 'Other / Custom' as an absolute last resort (NEVER default to Contemporary Fiction).
 */

// ============================================================================
// 1. MASTER GENRE TAXONOMY (25 Curated Categories)
// ============================================================================

export type MasterGenre =
  | 'Fantasy'
  | 'Romantasy'
  | 'Epic / High Fantasy'
  | 'Science Fiction'
  | 'Dystopian & Post-Apocalyptic'
  | 'Romance'
  | 'Historical Fiction'
  | 'Classics'
  | 'Mystery'
  | 'Thriller & Suspense'
  | 'Crime & Noir'
  | 'Horror'
  | 'Literary Fiction'
  | 'Contemporary Fiction'
  | 'Young Adult (YA)'
  | 'New Adult'
  | 'Graphic Novels & Manga'
  | 'Biography & Memoir'
  | 'History'
  | 'Self-Help & Psychology'
  | 'Business & Personal Finance'
  | 'Philosophy & Science'
  | 'Essays, Poetry & Short Stories'
  | 'Non-Fiction (General)'
  | 'Other / Custom';

export const MASTER_GENRES: readonly MasterGenre[] = [
  'Fantasy',
  'Romantasy',
  'Epic / High Fantasy',
  'Science Fiction',
  'Dystopian & Post-Apocalyptic',
  'Romance',
  'Historical Fiction',
  'Classics',
  'Mystery',
  'Thriller & Suspense',
  'Crime & Noir',
  'Horror',
  'Literary Fiction',
  'Contemporary Fiction',
  'Young Adult (YA)',
  'New Adult',
  'Graphic Novels & Manga',
  'Biography & Memoir',
  'History',
  'Self-Help & Psychology',
  'Business & Personal Finance',
  'Philosophy & Science',
  'Essays, Poetry & Short Stories',
  'Non-Fiction (General)',
  'Other / Custom',
] as const;

const MASTER_GENRE_SET: ReadonlySet<string> = new Set<string>(MASTER_GENRES);

export function isMasterGenre(value: unknown): value is MasterGenre {
  return typeof value === 'string' && MASTER_GENRE_SET.has(value);
}

// ============================================================================
// 2. METADATA & RECHARTS COLOR PALETTE
// ============================================================================

export interface GenreMeta {
  genre: MasterGenre;
  color: string;
  emoji: string;
  category: 'Fiction' | 'Non-Fiction' | 'Specialty';
  description: string;
}

export const GENRE_METADATA: Record<MasterGenre, GenreMeta> = {
  'Fantasy': {
    genre: 'Fantasy',
    color: '#8b5cf6',
    emoji: '🧙',
    category: 'Fiction',
    description: 'Magic, mythical realms, and folklore adventures.',
  },
  'Romantasy': {
    genre: 'Romantasy',
    color: '#f43f5e',
    emoji: '🗡️❤️',
    category: 'Fiction',
    description: 'High-stakes fantasy intertwined with intense romantic arcs.',
  },
  'Epic / High Fantasy': {
    genre: 'Epic / High Fantasy',
    color: '#7c3aed',
    emoji: '👑',
    category: 'Fiction',
    description: 'Expansive world-building, grand quests, and sweeping lore.',
  },
  'Science Fiction': {
    genre: 'Science Fiction',
    color: '#06b6d4',
    emoji: '🚀',
    category: 'Fiction',
    description: 'Space exploration, technology, time travel, and speculative science.',
  },
  'Dystopian & Post-Apocalyptic': {
    genre: 'Dystopian & Post-Apocalyptic',
    color: '#ea580c',
    emoji: '☣️',
    category: 'Fiction',
    description: 'Totalitarian regimes, survival wasteland, and societal collapse.',
  },
  'Romance': {
    genre: 'Romance',
    color: '#ec4899',
    emoji: '💖',
    category: 'Fiction',
    description: 'Love stories, emotional journeys, and relationship dynamics.',
  },
  'Historical Fiction': {
    genre: 'Historical Fiction',
    color: '#d97706',
    emoji: '🏛️',
    category: 'Fiction',
    description: 'Narratives set within authentic past eras and historical settings.',
  },
  'Classics': {
    genre: 'Classics',
    color: '#eab308',
    emoji: '📜',
    category: 'Fiction',
    description: 'Timeless literary canon, foundational literature, and antique masterpieces.',
  },
  'Mystery': {
    genre: 'Mystery',
    color: '#14b8a6',
    emoji: '🔍',
    category: 'Fiction',
    description: 'Whodunits, investigations, clues, and puzzle resolutions.',
  },
  'Thriller & Suspense': {
    genre: 'Thriller & Suspense',
    color: '#ef4444',
    emoji: '⚡',
    category: 'Fiction',
    description: 'Psychological tension, edge-of-seat pacing, and twists.',
  },
  'Crime & Noir': {
    genre: 'Crime & Noir',
    color: '#64748b',
    emoji: '🕵️',
    category: 'Fiction',
    description: 'Underworld, detectives, heists, gritty noir, and legal crime.',
  },
  'Horror': {
    genre: 'Horror',
    color: '#991b1b',
    emoji: '🩸',
    category: 'Fiction',
    description: 'Supernatural terror, dread, gothic chills, and psychological fright.',
  },
  'Literary Fiction': {
    genre: 'Literary Fiction',
    color: '#3b82f6',
    emoji: '✒️',
    category: 'Fiction',
    description: 'Character-driven prose, philosophical depth, and artistic style.',
  },
  'Contemporary Fiction': {
    genre: 'Contemporary Fiction',
    color: '#0ea5e9',
    emoji: '☕',
    category: 'Fiction',
    description: 'Modern real-life dramas, relationships, and everyday human stories.',
  },
  'Young Adult (YA)': {
    genre: 'Young Adult (YA)',
    color: '#10b981',
    emoji: '🎒',
    category: 'Fiction',
    description: 'Coming-of-age journeys and teen protagonists.',
  },
  'New Adult': {
    genre: 'New Adult',
    color: '#f97316',
    emoji: '🎓',
    category: 'Fiction',
    description: 'College-age transitions, early career struggles, and mature romance.',
  },
  'Graphic Novels & Manga': {
    genre: 'Graphic Novels & Manga',
    color: '#a855f7',
    emoji: '🎨',
    category: 'Specialty',
    description: 'Comics, sequential art, manga, webtoons, and graphic memoirs.',
  },
  'Biography & Memoir': {
    genre: 'Biography & Memoir',
    color: '#f59e0b',
    emoji: '👤',
    category: 'Non-Fiction',
    description: 'True personal life accounts, memoirs, and autobiographies.',
  },
  'History': {
    genre: 'History',
    color: '#b45309',
    emoji: '🏺',
    category: 'Non-Fiction',
    description: 'Non-fiction historical accounts, civilizational events, and wars.',
  },
  'Self-Help & Psychology': {
    genre: 'Self-Help & Psychology',
    color: '#22c55e',
    emoji: '🌱',
    category: 'Non-Fiction',
    description: 'Habits, productivity, mental health, resilience, and personal growth.',
  },
  'Business & Personal Finance': {
    genre: 'Business & Personal Finance',
    color: '#15803d',
    emoji: '📈',
    category: 'Non-Fiction',
    description: 'Economics, entrepreneurship, investing, money, and management.',
  },
  'Philosophy & Science': {
    genre: 'Philosophy & Science',
    color: '#6366f1',
    emoji: '🪐',
    category: 'Non-Fiction',
    description: 'Astrophysics, biology, nature, ethics, logic, and philosophy of mind.',
  },
  'Essays, Poetry & Short Stories': {
    genre: 'Essays, Poetry & Short Stories',
    color: '#d946ef',
    emoji: '🪶',
    category: 'Specialty',
    description: 'Verses, anthologies, poetic collections, and standalone essay collections.',
  },
  'Non-Fiction (General)': {
    genre: 'Non-Fiction (General)',
    color: '#78716c',
    emoji: '📖',
    category: 'Non-Fiction',
    description: 'Journalism, cultural essays, investigative reporting, and general non-fiction.',
  },
  'Other / Custom': {
    genre: 'Other / Custom',
    color: '#57534e',
    emoji: '🏷️',
    category: 'Specialty',
    description: 'Specialized niche topics or uncategorized reader tags.',
  },
};

// ============================================================================
// 3. JUNK / NOISE SCRUBBING
// ============================================================================

/**
 * Strips non-genre shelf tags from Goodreads, OpenLibrary, and bookstore CSVs.
 * CRITICAL: Strips generic standalone "fiction", "general fiction", "novel"
 * so they cannot poison or divert classification into broad buckets.
 */
const JUNK_METADATA_REGEX =
  /^(to-read|read|currently-reading|favorites|favourites|owned|owned-books|books-i-own|wishlist|dnf|did-not-finish|abandoned|tbr|borrowed|library|kindle|kindle-unlimited|ebook|e-book|audiobook|audible|physical|hardcover|paperback|arc|netgalley|reviewed|reviewed-books|re-read|reread|book-club|5-stars|five-stars|4-stars|four-stars|3-stars|all-time-favorites|stand-alone|standalone|series|duology|trilogy|box-set|bestseller|new-york-times|booktok|bookstagram|read-in-\d{4}|\d{4}-reads|\d{4}-books|\d{4}-tbr|unread|published-\d{4}|edition|volume|english|american|translated|fiction|general-fiction|general fiction|novels?|books?|literature|prose)$/i;

// ============================================================================
// 4. LANDMARK CANON REGISTRY (High-Intent Book Recognition)
// ============================================================================

interface LandmarkCanonRule {
  pattern: RegExp;
  primary: MasterGenre;
  secondary?: MasterGenre;
}

/**
 * Curated ground truth for iconic landmark books and authors that users frequently
 * import with minimal tags (e.g. Goodreads shelf: "fiction, read, favorites").
 * Prevents books like Dune from ever falling into generic Contemporary Fiction.
 */
const LANDMARK_CANON_REGISTRY: LandmarkCanonRule[] = [
  // Dune Series (Frank Herbert)
  {
    pattern: /\b(dune|dune messiah|children of dune|god emperor of dune|heretics of dune|chapterhouse dune|frank herbert|arrakis|paul atreides|bene gesserit|sandworms of dune)\b/i,
    primary: 'Science Fiction',
    secondary: 'Epic / High Fantasy',
  },
  // 1984 / Orwell
  {
    pattern: /\b(1984|nineteen eighty[- ]four|george orwell|big brother|animal farm)\b/i,
    primary: 'Dystopian & Post-Apocalyptic',
    secondary: 'Classics',
  },
  // Brave New World
  {
    pattern: /\b(brave new world|aldous huxley)\b/i,
    primary: 'Dystopian & Post-Apocalyptic',
    secondary: 'Classics',
  },
  // Fahrenheit 451
  {
    pattern: /\b(fahrenheit 451|ray bradbury)\b/i,
    primary: 'Dystopian & Post-Apocalyptic',
    secondary: 'Classics',
  },
  // Neuromancer / Cyberpunk
  {
    pattern: /\b(neuromancer|count zero|mona lisa overdrive|william gibson|snow crash|neal stephenson)\b/i,
    primary: 'Science Fiction',
    secondary: 'Dystopian & Post-Apocalyptic',
  },
  // Red Rising
  {
    pattern: /\b(red rising|golden son|morning star|iron gold|dark age|light bringer|pierce brown)\b/i,
    primary: 'Science Fiction',
    secondary: 'Dystopian & Post-Apocalyptic',
  },
  // Andy Weir Sci-Fi
  {
    pattern: /\b(project hail mary|the martian|andy weir|artemis)\b/i,
    primary: 'Science Fiction',
  },
  // Three-Body Problem
  {
    pattern: /\b(three[- ]body problem|dark forest|death[']?s end|cixin liu)\b/i,
    primary: 'Science Fiction',
    secondary: 'Philosophy & Science',
  },
  // Asimov Foundation / Robots
  {
    pattern: /\b(foundation and empire|second foundation|isaac asimov|i,? robot|caves of steel)\b/i,
    primary: 'Science Fiction',
    secondary: 'Classics',
  },
  // Hyperion
  {
    pattern: /\b(hyperion|fall of hyperion|dan simmons)\b/i,
    primary: 'Science Fiction',
    secondary: 'Epic / High Fantasy',
  },
  // Fourth Wing / Yarros (Romantasy)
  {
    pattern: /\b(fourth wing|iron flame|onyx storm|rebecca yarros|basgiath)\b/i,
    primary: 'Romantasy',
    secondary: 'Epic / High Fantasy',
  },
  // ACOTAR / Maas (Romantasy)
  {
    pattern: /\b(court of thorns and roses|acotar|court of mist and fury|acomaf|court of wings and ruin|crescent city|house of earth and blood|throne of glass|sarah j\.? maas)\b/i,
    primary: 'Romantasy',
    secondary: 'Epic / High Fantasy',
  },
  // From Blood and Ash
  {
    pattern: /\b(from blood and ash|kingdom of flesh and fire|jennifer l\.? armentrout)\b/i,
    primary: 'Romantasy',
    secondary: 'Fantasy',
  },
  // Tolkien
  {
    pattern: /\b(lord of the rings|fellowship of the ring|two towers|return of the king|the hobbit|silmarillion|j\.?r\.?r\.? tolkien)\b/i,
    primary: 'Epic / High Fantasy',
    secondary: 'Classics',
  },
  // Sanderson Cosmere
  {
    pattern: /\b(the way of kings|words of radiance|oathbringer|rhythm of war|wind and truth|mistborn|the final empire|brandon sanderson|stormlight archive)\b/i,
    primary: 'Epic / High Fantasy',
  },
  // Wheel of Time
  {
    pattern: /\b(the eye of the world|wheel of time|robert jordan)\b/i,
    primary: 'Epic / High Fantasy',
  },
  // Name of the Wind
  {
    pattern: /\b(the name of the wind|wise man[']?s fear|patrick rothfuss)\b/i,
    primary: 'Epic / High Fantasy',
  },
  // Hunger Games
  {
    pattern: /\b(the hunger games|catching fire|mockingjay|ballad of songbirds and snakes|suzanne collins)\b/i,
    primary: 'Dystopian & Post-Apocalyptic',
    secondary: 'Young Adult (YA)',
  },
  // Classic Horror
  {
    pattern: /\b(dracula|bram stoker)\b/i,
    primary: 'Horror',
    secondary: 'Classics',
  },
  {
    pattern: /\b(frankenstein|mary shelley)\b/i,
    primary: 'Classics',
    secondary: 'Science Fiction',
  },
  // Stephen King Horror
  {
    pattern: /\b(the shining|salem[']?s lot|pet sematary|carrie|stephen king)\b/i,
    primary: 'Horror',
    secondary: 'Thriller & Suspense',
  },
  // Sherlock Holmes
  {
    pattern: /\b(sherlock holmes|hound of the baskervilles|arthur conan doyle)\b/i,
    primary: 'Mystery',
    secondary: 'Classics',
  },
  // Agatha Christie
  {
    pattern: /\b(agatha christie|hercule poirot|murder on the orient express|and then there were none)\b/i,
    primary: 'Mystery',
    secondary: 'Crime & Noir',
  },
  // Jane Austen
  {
    pattern: /\b(pride and prejudice|sense and sensibility|emma|jane austen)\b/i,
    primary: 'Classics',
    secondary: 'Romance',
  },
  // Bronte Sisters
  {
    pattern: /\b(jane eyre|wuthering heights|charlotte bronte|emily bronte)\b/i,
    primary: 'Classics',
    secondary: 'Romance',
  },
  // The Great Gatsby
  {
    pattern: /\b(the great gatsby|f\.? scott fitzgerald)\b/i,
    primary: 'Classics',
    secondary: 'Historical Fiction',
  },
  // Sapiens
  {
    pattern: /\b(sapiens|homo deus|yuval noah harari)\b/i,
    primary: 'History',
    secondary: 'Non-Fiction (General)',
  },
  // Atomic Habits
  {
    pattern: /\b(atomic habits|james clear)\b/i,
    primary: 'Self-Help & Psychology',
  },
  // Psychology of Money
  {
    pattern: /\b(psychology of money|morgan housel)\b/i,
    primary: 'Business & Personal Finance',
    secondary: 'Self-Help & Psychology',
  },
];

// ============================================================================
// 5. HIGH-INTENT SPECIFIC GENRE RULE MATRIX (Weighted Priority)
// ============================================================================

interface PatternRule {
  genre: MasterGenre;
  patterns: RegExp[];
  baseWeight: number;
}

/**
 * Strict priority list: High-intent subgenres receive top weight (110-125).
 * Broad realist buckets (Contemporary Fiction, Literary Fiction) are severely
 * deprioritized and strictly gated so they can NEVER override specific genres.
 */
const GENRE_RULES: PatternRule[] = [
  // 1. Romantasy (Explicit)
  {
    genre: 'Romantasy',
    patterns: [
      /\bromantasy\b/i,
      /\bfantasy\s*romance\b/i,
      /\bromantic\s*fantasy\b/i,
      /\bfae\s*romance\b/i,
      /\benemies\s*to\s*lovers\s*fantasy\b/i,
      /\bparanormal\s*romance\b/i,
      /\burban\s*fantasy\s*romance\b/i,
      /\bdragon\s*rider\s*romance\b/i,
    ],
    baseWeight: 125,
  },
  // 2. Science Fiction
  {
    genre: 'Science Fiction',
    patterns: [
      /\bsci[- ]?fi\b/i,
      /\bscience\s*fiction\b/i,
      /\bspace\s*opera\b/i,
      /\bcyberpunk\b/i,
      /\bsteampunk\b/i,
      /\bhard\s*sci[- ]?fi\b/i,
      /\bspace\s*exploration\b/i,
      /\balien[s]?\b/i,
      /\btime\s*travel\b/i,
      /\bartificial\s*intelligence\b/i,
      /\brobot[s]?\b/i,
      /\bandroid[s]?\b/i,
      /\binterstellar\b/i,
      /\bastronomy\s*fiction\b/i,
      /\bplanetary\s*romance\b/i,
      /\bsolarpunk\b/i,
    ],
    baseWeight: 120,
  },
  // 3. Dystopian & Post-Apocalyptic
  {
    genre: 'Dystopian & Post-Apocalyptic',
    patterns: [
      /\bdystop(ia|ian)\b/i,
      /\bpost[- ]apocalyptic\b/i,
      /\bpost[- ]apocalypse\b/i,
      /\bapocalypse\b/i,
      /\bapocalyptic\b/i,
      /\bcli[- ]fi\b/i,
      /\bsurvival\s*fiction\b/i,
      /\bya\s*dystop(ia|ian)\b/i,
      /\btotalitarian(ism)?\b/i,
      /\bwasteland\b/i,
      /\bsurveillance\s*state\b/i,
    ],
    baseWeight: 118,
  },
  // 4. Epic / High Fantasy
  {
    genre: 'Epic / High Fantasy',
    patterns: [
      /\bhigh\s*fantasy\b/i,
      /\bepic\s*fantasy\b/i,
      /\bsword\s*and\s*sorcery\b/i,
      /\bgrimdark\b/i,
      /\bdark\s*fantasy\b/i,
      /\bepic-fantasy\b/i,
      /\bhigh-fantasy\b/i,
      /\bworld[- ]building\b/i,
    ],
    baseWeight: 115,
  },
  // 5. Graphic Novels & Manga
  {
    genre: 'Graphic Novels & Manga',
    patterns: [
      /\bgraphic\s*novel[s]?\b/i,
      /\bmanga\b/i,
      /\bcomic[s]?\b/i,
      /\bwebtoon[s]?\b/i,
      /\bmanhwa\b/i,
      /\bmanhua\b/i,
      /\banime\b/i,
      /\bsequential\s*art\b/i,
      /\bbd\b/i,
    ],
    baseWeight: 115,
  },
  // 6. Fantasy (General)
  {
    genre: 'Fantasy',
    patterns: [
      /\bfantasy\b/i,
      /\bmagic(al)?\b/i,
      /\bmytholog(y|ical)\b/i,
      /\bwitch(craft|es)?\b/i,
      /\bdragon[s]?\b/i,
      /\bfae\b/i,
      /\bfaeries?\b/i,
      /\burban\s*fantasy\b/i,
      /\bcozy\s*fantasy\b/i,
      /\bsorcer(y|er)\b/i,
    ],
    baseWeight: 110,
  },
  // 7. Romance (General)
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
    ],
    baseWeight: 105,
  },
  // 8. Classics
  {
    genre: 'Classics',
    patterns: [
      /\bclassic[s]?\b/i,
      /\bliterary\s*classic[s]?\b/i,
      /\b19th\s*century\b/i,
      /\b18th\s*century\b/i,
      /\bvictorian\b/i,
      /\bancient\s*literature\b/i,
      /\bgreek\s*myth\b/i,
      /\bwestern\s*canon\b/i,
      /\bliterary\s*canon\b/i,
    ],
    baseWeight: 104,
  },
  // 9. Historical Fiction
  {
    genre: 'Historical Fiction',
    patterns: [
      /\bhistorical\s*fiction\b/i,
      /\bhistorical[- ]novel\b/i,
      /\bwwii\s*fiction\b/i,
      /\bperiod\s*drama\b/i,
      /\btudor\b/i,
      /\bregency\s*(?!romance)\b/i,
      /\bmedieval\s*fiction\b/i,
      /\bhistorical\s*mystery\b/i,
    ],
    baseWeight: 102,
  },
  // 10. Crime & Noir
  {
    genre: 'Crime & Noir',
    patterns: [
      /\btrue\s*crime\b/i,
      /\bcrime\b/i,
      /\bnoir\b/i,
      /\bhardboiled\b/i,
      /\bpolice\s*procedural\b/i,
      /\bdetective\b/i,
      /\bmafia\b/i,
      /\bheist\b/i,
      /\bgangster\b/i,
    ],
    baseWeight: 100,
  },
  // 11. Horror
  {
    genre: 'Horror',
    patterns: [
      /\bhorror\b/i,
      /\bgothic\s*horror\b/i,
      /\bparanormal\s*(?!romance)\b/i,
      /\bsupernatural\b/i,
      /\bhaunted\b/i,
      /\bghost\s*story\b/i,
      /\bbody\s*horror\b/i,
      /\bcosmic\s*horror\b/i,
      /\bpsychological\s*horror\b/i,
    ],
    baseWeight: 100,
  },
  // 12. Thriller & Suspense
  {
    genre: 'Thriller & Suspense',
    patterns: [
      /\bpsychological\s*thriller\b/i,
      /\bthriller\b/i,
      /\bsuspense\b/i,
      /\blegal\s*thriller\b/i,
      /\bespionage\b/i,
      /\bspy\s*thriller\b/i,
      /\bdomestic\s*thriller\b/i,
      /\baction\s*thriller\b/i,
    ],
    baseWeight: 98,
  },
  // 13. Mystery
  {
    genre: 'Mystery',
    patterns: [
      /\bmystery\b/i,
      /\bcozy\s*mystery\b/i,
      /\bwhodunit\b/i,
      /\bmurder\s*mystery\b/i,
      /\binvestigat(ion|or)\b/i,
      /\bsleuth\b/i,
    ],
    baseWeight: 96,
  },
  // 14. Business & Personal Finance
  {
    genre: 'Business & Personal Finance',
    patterns: [
      /\bpersonal\s*finance\b/i,
      /\bfinance\b/i,
      /\binvest(ing|ment)\b/i,
      /\bmoney\b/i,
      /\beconomics\b/i,
      /\bbusiness\b/i,
      /\bentrepreneur(ship)?\b/i,
      /\bmanagement\b/i,
      /\bleadership\b/i,
      /\bwealth\b/i,
      /\bstock\s*market\b/i,
    ],
    baseWeight: 94,
  },
  // 15. Self-Help & Psychology
  {
    genre: 'Self-Help & Psychology',
    patterns: [
      /\bself[- ]help\b/i,
      /\bpersonal\s*development\b/i,
      /\bproductivity\b/i,
      /\bhabit[s]?\b/i,
      /\bpsychology\b/i,
      /\bmental\s*health\b/i,
      /\bmindfulness\b/i,
      /\bmotivation\b/i,
      /\bcognitive\b/i,
      /\bself[- ]improvement\b/i,
    ],
    baseWeight: 92,
  },
  // 16. Philosophy & Science
  {
    genre: 'Philosophy & Science',
    patterns: [
      /\bphilosophy\b/i,
      /\bphilosophical\b/i,
      /\bpopular\s*science\b/i,
      /\bastronomy\b/i,
      /\bastrophysics\b/i,
      /\bphysics\b/i,
      /\bbiology\b/i,
      /\bevolution\b/i,
      /\bneuroscience\b/i,
      /\bcosmology\b/i,
      /\bethics\b/i,
    ],
    baseWeight: 90,
  },
  // 17. Biography & Memoir
  {
    genre: 'Biography & Memoir',
    patterns: [
      /\bmemoir[s]?\b/i,
      /\bbiograph(y|ies)\b/i,
      /\bautobiograph(y|ies)\b/i,
      /\bdiary\b/i,
      /\blife\s*story\b/i,
    ],
    baseWeight: 90,
  },
  // 18. History (Non-Fiction)
  {
    genre: 'History',
    patterns: [
      /\bhistory\b/i,
      /\bworld\s*war\b/i,
      /\bwwii\b/i,
      /\bwwi\b/i,
      /\bancient\s*rome\b/i,
      /\bancient\s*greece\b/i,
      /\bcivil\s*war\b/i,
      /\bmilitary\s*history\b/i,
      /\bholocaust\b/i,
    ],
    baseWeight: 88,
  },
  // 19. Essays, Poetry & Short Stories
  {
    genre: 'Essays, Poetry & Short Stories',
    patterns: [
      /\bpoetry\b/i,
      /\bpoem[s]?\b/i,
      /\bverse\b/i,
      /\bessays?\b/i,
      /\bshort\s*stories\b/i,
      /\bantholog(y|ies)\b/i,
    ],
    baseWeight: 88,
  },
  // 20. Young Adult (YA)
  {
    genre: 'Young Adult (YA)',
    patterns: [
      /\bya\b/i,
      /\byoung\s*adult\b/i,
      /\bteen\b/i,
      /\bcoming\s*of\s*age\b/i,
      /\bjuvenile\b/i,
    ],
    baseWeight: 84,
  },
  // 21. New Adult
  {
    genre: 'New Adult',
    patterns: [
      /\bnew\s*adult\b/i,
      /\bcollege\s*romance\b/i,
      /\bna\b/i,
    ],
    baseWeight: 82,
  },
  // 22. Non-Fiction (General)
  {
    genre: 'Non-Fiction (General)',
    patterns: [
      /\bnon[- ]fiction\b/i,
      /\bnonfiction\b/i,
      /\bjournalism\b/i,
      /\bcurrent\s*affairs\b/i,
      /\bsociology\b/i,
    ],
    baseWeight: 70,
  },
  // 23. Literary Fiction (HEAVILY SUPPRESSED - Only matches explicit literary tags)
  {
    genre: 'Literary Fiction',
    patterns: [
      /\bliterary\s*fiction\b/i,
      /\blit\s*fic\b/i,
      /\bbooker\s*prize\b/i,
      /\bpulitzer\b/i,
    ],
    baseWeight: 45,
  },
  // 24. Contemporary Fiction (STRICTLY GATED - Lowest priority, never matches generic "fiction")
  {
    genre: 'Contemporary Fiction',
    patterns: [
      /\bcontemporary\s*fiction\b/i,
      /\brealistic\s*fiction\b/i,
      /\bfamily\s*saga\b/i,
    ],
    baseWeight: 25,
  },
];

// ============================================================================
// 6. TOKENIZATION & INPUT SANITIZATION
// ============================================================================

export function tokenizeRawGenreInput(rawInput: string | string[]): string[] {
  if (!rawInput) return [];

  const rawTokens: string[] = [];

  const addParsedString = (str: string) => {
    if (!str || typeof str !== 'string') return;
    const trimmed = str.trim();
    if (!trimmed) return;

    // Handle stringified JSON array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => addParsedString(String(item)));
          return;
        }
      } catch {
        // Continue with standard splitting
      }
    }

    const splits = trimmed.split(/[,|/;\n\r]+/);
    for (const s of splits) {
      const clean = s.trim().toLowerCase();
      if (clean) {
        rawTokens.push(clean);
      }
    }
  };

  if (Array.isArray(rawInput)) {
    for (const item of rawInput) addParsedString(item);
  } else {
    addParsedString(rawInput);
  }

  // Scrub junk tracking tags and generic standalone "fiction"
  return rawTokens.filter((token) => !JUNK_METADATA_REGEX.test(token));
}

// ============================================================================
// 7. CORE EXTRACTION & INTERSECTION ENGINE
// ============================================================================

export interface ExtractGenreOptions {
  /** Optional book title context for iconic canon matching (e.g. "Dune", "1984") */
  title?: string;
  /** Optional author context */
  author?: string;
  /** Maximum number of genres to return (defaults to 2: primary + secondary) */
  maxGenres?: number;
  /** Fallback if zero keywords or patterns match. Defaults to 'Other / Custom' */
  fallback?: MasterGenre;
  /**
   * Romantasy formatting mode:
   * 'hybrid' -> ['Romantasy'] as a distinct powerhouse category (Default)
   * 'split'  -> ['Fantasy', 'Romance']
   */
  romantasyFormat?: 'hybrid' | 'split';
  /** Whether to enable multi-tag intersections */
  enableIntersections?: boolean;
}

/**
 * Checks for landmark canon matches (Dune, 1984, Fourth Wing, etc.)
 * across both the input tokens and optional title/author options.
 */
function checkLandmarkCanon(fullJoinedText: string): LandmarkCanonRule | null {
  for (const rule of LANDMARK_CANON_REGISTRY) {
    if (rule.pattern.test(fullJoinedText)) {
      return rule;
    }
  }
  return null;
}

/**
 * Scores candidate genres against refined priority rules.
 */
function scoreCandidateGenres(
  tokens: string[],
  fullJoinedText: string
): Map<MasterGenre, number> {
  const scores = new Map<MasterGenre, number>();

  const addScore = (genre: MasterGenre, delta: number) => {
    const current = scores.get(genre) || 0;
    scores.set(genre, current + delta);
  };

  for (const rule of GENRE_RULES) {
    let matchedInTokens = 0;

    for (const token of tokens) {
      for (const pattern of rule.patterns) {
        if (pattern.test(token)) {
          matchedInTokens++;
          break;
        }
      }
    }

    if (matchedInTokens > 0) {
      const score = rule.baseWeight + (matchedInTokens - 1) * 20;
      addScore(rule.genre, score);
    } else {
      // Check full joined text for multi-word phrases
      for (const pattern of rule.patterns) {
        if (pattern.test(fullJoinedText)) {
          addScore(rule.genre, rule.baseWeight * 0.9);
          break;
        }
      }
    }
  }

  return scores;
}

/**
 * Applies smart intersections and resolves parent/child category collisions.
 */
function resolveIntersections(
  scores: Map<MasterGenre, number>,
  fullJoinedText: string,
  romantasyFormat: 'hybrid' | 'split'
): Map<MasterGenre, number> {
  const resolved = new Map<MasterGenre, number>(scores);

  const hasFantasy = (resolved.get('Fantasy') || 0) > 0;
  const hasRomance = (resolved.get('Romance') || 0) > 0;
  const hasRomantasy = (resolved.get('Romantasy') || 0) > 0;
  const hasEpicFantasy = (resolved.get('Epic / High Fantasy') || 0) > 0;
  const hasSciFi = (resolved.get('Science Fiction') || 0) > 0;
  const hasDystopian = (resolved.get('Dystopian & Post-Apocalyptic') || 0) > 0;
  const hasClassics = (resolved.get('Classics') || 0) > 0;
  const hasMystery = (resolved.get('Mystery') || 0) > 0;
  const hasThriller = (resolved.get('Thriller & Suspense') || 0) > 0;
  const hasCrime = (resolved.get('Crime & Noir') || 0) > 0;
  const hasHistory = (resolved.get('History') || 0) > 0;
  const hasHistoricalFiction = (resolved.get('Historical Fiction') || 0) > 0;

  // 1. SMART INTERSECTION: Fantasy + Romance = Romantasy
  if ((hasFantasy && hasRomance) || hasRomantasy) {
    if (romantasyFormat === 'split') {
      // Split mode: ensure both Fantasy and Romance are high
      resolved.set('Fantasy', Math.max(resolved.get('Fantasy') || 0, 115));
      resolved.set('Romance', Math.max(resolved.get('Romance') || 0, 114));
      resolved.delete('Romantasy');
    } else {
      // Hybrid mode (Default): Romantasy is the powerhouse primary
      const boost = Math.max(
        resolved.get('Romantasy') || 0,
        (resolved.get('Fantasy') || 0) + (resolved.get('Romance') || 0)
      );
      resolved.set('Romantasy', boost + 40);

      // Suppress redundant generic Fantasy and Romance from taking secondary slot
      if (!hasEpicFantasy) {
        resolved.delete('Fantasy');
      } else {
        resolved.set('Fantasy', (resolved.get('Fantasy') || 0) * 0.1);
      }
      resolved.delete('Romance');
    }
  }

  // 2. High / Epic Fantasy absorbs generic Fantasy
  if (hasEpicFantasy && hasFantasy) {
    resolved.set('Epic / High Fantasy', (resolved.get('Epic / High Fantasy') || 0) + 25);
    resolved.delete('Fantasy');
  }

  // 3. Classic Dystopian (e.g. 1984, Brave New World, Fahrenheit 451)
  if (hasClassics && hasDystopian) {
    resolved.set('Dystopian & Post-Apocalyptic', (resolved.get('Dystopian & Post-Apocalyptic') || 0) + 20);
    resolved.set('Classics', (resolved.get('Classics') || 0) + 15);
    // Suppress general sci-fi if classic dystopian is the core identity
    if (hasSciFi) {
      resolved.set('Science Fiction', (resolved.get('Science Fiction') || 0) * 0.4);
    }
  }

  // 4. Mystery & Thriller / Crime synergy
  if (hasMystery && hasThriller) {
    resolved.set('Thriller & Suspense', (resolved.get('Thriller & Suspense') || 0) + 10);
    resolved.set('Mystery', (resolved.get('Mystery') || 0) + 8);
  }
  if (hasCrime && hasThriller) {
    resolved.set('Crime & Noir', (resolved.get('Crime & Noir') || 0) + 10);
  }

  // 5. History vs Historical Fiction resolution
  if (hasHistory && hasHistoricalFiction) {
    const isNonFiction = /\b(non[- ]fiction|biography|memoir|true story|historical account)\b/i.test(fullJoinedText);
    if (isNonFiction) {
      resolved.set('History', (resolved.get('History') || 0) + 25);
      resolved.delete('Historical Fiction');
    } else {
      resolved.set('Historical Fiction', (resolved.get('Historical Fiction') || 0) + 25);
      resolved.delete('History');
    }
  }

  // 6. GATING: If ANY Tier 1 high-intent genre matched, completely purge Contemporary Fiction
  const hasHighIntentMatch =
    (resolved.get('Science Fiction') || 0) > 0 ||
    (resolved.get('Dystopian & Post-Apocalyptic') || 0) > 0 ||
    (resolved.get('Romantasy') || 0) > 0 ||
    (resolved.get('Fantasy') || 0) > 0 ||
    (resolved.get('Epic / High Fantasy') || 0) > 0 ||
    (resolved.get('Romance') || 0) > 0 ||
    (resolved.get('Historical Fiction') || 0) > 0 ||
    (resolved.get('Classics') || 0) > 0 ||
    (resolved.get('Mystery') || 0) > 0 ||
    (resolved.get('Thriller & Suspense') || 0) > 0 ||
    (resolved.get('Crime & Noir') || 0) > 0 ||
    (resolved.get('Horror') || 0) > 0 ||
    (resolved.get('Graphic Novels & Manga') || 0) > 0 ||
    (resolved.get('Business & Personal Finance') || 0) > 0 ||
    (resolved.get('Self-Help & Psychology') || 0) > 0 ||
    (resolved.get('Philosophy & Science') || 0) > 0 ||
    (resolved.get('Biography & Memoir') || 0) > 0 ||
    (resolved.get('History') || 0) > 0 ||
    (resolved.get('Essays, Poetry & Short Stories') || 0) > 0 ||
    (resolved.get('Young Adult (YA)') || 0) > 0 ||
    (resolved.get('New Adult') || 0) > 0;

  if (hasHighIntentMatch) {
    resolved.delete('Contemporary Fiction');
  }

  return resolved;
}

/**
 * The Core Extraction Function.
 * Returns an array of up to 2 distinct MasterGenres [primaryGenre, secondaryGenre?].
 * Eliminates broad fallbacks and guarantees specific high-intent assignment.
 */
export function extractGenres(
  rawInput: string | string[],
  options: ExtractGenreOptions = {}
): MasterGenre[] {
  const {
    title = '',
    author = '',
    maxGenres = 2,
    fallback = 'Other / Custom',
    romantasyFormat = 'hybrid',
    enableIntersections = true,
  } = options;

  // 1. Direct pass-through if single input is already an exact MasterGenre
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (isMasterGenre(trimmed)) {
      return [trimmed];
    }
  }

  // 2. Tokenize and build full searchable text buffer
  const tokens = tokenizeRawGenreInput(rawInput);
  const inputStrings = Array.isArray(rawInput) ? rawInput : [rawInput];
  const combinedContext = [title, author, ...inputStrings].filter(Boolean).join(' ').toLowerCase();

  // 3. Check Landmark Canon Registry first (e.g. Dune, 1984, Fourth Wing)
  const landmarkMatch = checkLandmarkCanon(combinedContext);
  if (landmarkMatch) {
    const results: MasterGenre[] = [landmarkMatch.primary];
    if (landmarkMatch.secondary && landmarkMatch.secondary !== landmarkMatch.primary && maxGenres > 1) {
      results.push(landmarkMatch.secondary);
    }
    return results;
  }

  if (tokens.length === 0 && !combinedContext.trim()) {
    return [fallback];
  }

  // 4. Score Candidate Genres against priority rules
  let scores = scoreCandidateGenres(tokens, combinedContext);

  // 5. Apply multi-tag intersections & collision resolutions
  if (enableIntersections) {
    scores = resolveIntersections(scores, combinedContext, romantasyFormat);
  }

  // 6. Rank candidate genres by final score
  const rankedCandidates = Array.from(scores.entries())
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);

  // 7. Output distinct primary + optional secondary tuple
  const results: MasterGenre[] = [];
  for (const genre of rankedCandidates) {
    if (!results.includes(genre)) {
      results.push(genre);
    }
    if (results.length >= maxGenres) break;
  }

  // 8. Strict Fallback: Use 'Other / Custom' as absolute last resort
  if (results.length === 0) {
    return [fallback];
  }

  return results;
}

/**
 * Convenience helper to extract only the primary genre.
 */
export function extractPrimaryGenre(
  rawInput: string | string[],
  fallbackOrOptions: MasterGenre | ExtractGenreOptions = 'Other / Custom'
): MasterGenre {
  const options: ExtractGenreOptions =
    typeof fallbackOrOptions === 'string'
      ? { maxGenres: 1, fallback: fallbackOrOptions }
      : { ...fallbackOrOptions, maxGenres: 1, fallback: fallbackOrOptions.fallback || 'Other / Custom' };
  const genres = extractGenres(rawInput, options);
  return genres[0] || (options.fallback || 'Other / Custom');
}

/**
 * Formats genre array for UI labels (e.g. "Science Fiction / Classics").
 */
export function formatGenresLabel(genres: MasterGenre[] | undefined): string {
  if (!genres || genres.length === 0) return 'Other / Custom';
  return genres.join(' / ');
}

// ============================================================================
// 8. PRODUCTION TEST VERIFICATION SUITE
// ============================================================================

export interface GenreTestCase {
  label: string;
  input: string | string[];
  options?: ExtractGenreOptions;
  expected: MasterGenre[];
  explanation: string;
}

export const GENRE_TEST_EXAMPLES: GenreTestCase[] = [
  {
    label: 'Dune Must Classify as Science Fiction (Eliminating Lazy Fiction Fallback)',
    input: 'Dune by Frank Herbert',
    expected: ['Science Fiction', 'Epic / High Fantasy'],
    explanation: 'Dune is grounded as Science Fiction rather than broad Contemporary Fiction.',
  },
  {
    label: 'Dune with messy Goodreads tags (Fiction, Classics, Favorites)',
    input: ['fiction', 'classics', 'favorites', 'dune', 'general-fiction'],
    expected: ['Science Fiction', 'Epic / High Fantasy'],
    explanation: 'Scrubs generic fiction noise and maps Dune directly to Science Fiction.',
  },
  {
    label: 'Classic Dystopian (1984 by George Orwell)',
    input: ['classics', 'dystopian', '1984', 'totalitarianism'],
    expected: ['Dystopian & Post-Apocalyptic', 'Classics'],
    explanation: 'Pairs Dystopian & Post-Apocalyptic with Classics without diluting to generic Sci-Fi or Fiction.',
  },
  {
    label: 'Powerhouse Romantasy Hybrid Category',
    input: 'fantasy, romance, fae, high-fantasy, enemies-to-lovers',
    expected: ['Romantasy', 'Epic / High Fantasy'],
    explanation: 'Detects Fantasy + Romance intersection, elevating Romantasy as its own category.',
  },
  {
    label: 'Romantasy Split Mode When Explicitly Requested',
    input: 'fantasy, romance',
    options: { romantasyFormat: 'split' },
    expected: ['Fantasy', 'Romance'],
    explanation: 'Supports split mode [Fantasy, Romance] when callers request it.',
  },
  {
    label: 'Graphic Novels & Manga with noise tags',
    input: 'manga, shonen, graphic novels, comics, anime, read-in-2024',
    expected: ['Graphic Novels & Manga'],
    explanation: 'Maps comic and manga tags accurately to Graphic Novels & Manga.',
  },
  {
    label: 'Business & Finance vs Self-Help',
    input: ['investing', 'money', 'personal-finance', 'psychology', 'habits'],
    expected: ['Business & Personal Finance', 'Self-Help & Psychology'],
    explanation: 'Cleanly segments finance tags from self-improvement psychology tags.',
  },
  {
    label: 'Space Opera / Sci-Fi with generic Fiction tags in CSV',
    input: ['fiction', 'general-fiction', 'space opera', 'sci-fi', 'hard science fiction'],
    expected: ['Science Fiction'],
    explanation: 'Never allows generic fiction tags to overpower specific Science Fiction tags.',
  },
  {
    label: 'Crime Noir & Mystery',
    input: 'detective, true crime, murder mystery, police procedural, noir',
    expected: ['Crime & Noir', 'Mystery'],
    explanation: 'Assigns gritty Crime & Noir as primary and Mystery as secondary.',
  },
  {
    label: 'Messy Goodreads Shelf Tag Soup',
    input: 'favorites, to-read, kindle-unlimited, 2024-challenge, thriller, psychological thriller, suspense',
    expected: ['Thriller & Suspense'],
    explanation: 'Discards status noise and extracts clean Thriller & Suspense.',
  },
  {
    label: 'Absolute Last Resort Fallback (Other / Custom, NEVER Contemporary Fiction)',
    input: 'xyz123, wishlist-random, noname, completely-unknown-tag',
    expected: ['Other / Custom'],
    explanation: 'Gracefully returns Other / Custom rather than dumping into Contemporary Fiction.',
  },
];

/**
 * Self-test verification runner.
 */
export function runGenreMapperTests(): { passed: number; total: number; allPassed: boolean } {
  let passed = 0;
  for (const test of GENRE_TEST_EXAMPLES) {
    const actual = extractGenres(test.input, test.options);
    const isMatch =
      actual.length === test.expected.length &&
      actual.every((g, idx) => g === test.expected[idx]);

    if (isMatch) {
      passed++;
    } else {
      console.warn(
        `[GenreMapper Test Failure] "${test.label}" -> Expected:`,
        test.expected,
        'Got:',
        actual
      );
    }
  }

  return {
    passed,
    total: GENRE_TEST_EXAMPLES.length,
    allPassed: passed === GENRE_TEST_EXAMPLES.length,
  };
}
