import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BookEntry } from '../types/book';
import {
  calculateElapsedDays,
  calculatePPD,
  getArchetypeByPPD,
  snapToPrecision01,
} from '../utils/calculator';
import { VelocityTelemetryBar } from './VelocityTelemetryBar';
import { generateArchetypeCelebration } from '../utils/celebrationGenerator';
import { RatingInput } from './RatingInput';
import { playCelebrationChime } from '../utils/sound';
import { MASTER_GENRES, extractPrimaryGenre, extractGenres } from '../utils/genreMapper';
import {
  searchKnowledgeBase,
  findExactOrBestMatch,
  KnownBook,
} from '../data/bookKnowledgeBase';
import {
  searchBooksUnified,
  isIsbnQuery,
  extractCleanIsbn,
  ApiBookMetadata,
} from '../services/bookApiService';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Zap,
  Compass,
  Wine,
  Moon,
  Flame,
  Rocket,
  Armchair,
  Info,
  CheckCircle2,
  Search,
  Check,
  Undo2,
  Loader2,
  Globe,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface BookFormProps {
  onBookCreated: (book: BookEntry) => void;
  soundEnabled?: boolean;
}

export const BookForm: React.FC<BookFormProps> = ({
  onBookCreated,
  soundEnabled = true,
}) => {
  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  // 5 days ago
  const defaultStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number | ''>(384);
  const [startDate, setStartDate] = useState(defaultStart);
  const [finishDate, setFinishDate] = useState(todayStr);
  const [rating, setRating] = useState<number>(4.4);
  const [review, setReview] = useState('');
  const [genre, setGenre] = useState('Fantasy');
  const [format, setFormat] = useState<'Physical' | 'E-Reader' | 'Audiobook' | 'Hybrid'>('Physical');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [isbn, setIsbn] = useState<string | undefined>(undefined);
  const [publisher, setPublisher] = useState<string | undefined>(undefined);
  const [publishedYear, setPublishedYear] = useState<number | undefined>(undefined);

  // Track if user explicitly entered an exact page count (must override auto-filled values)
  const [hasUserCustomizedPages, setHasUserCustomizedPages] = useState<boolean>(false);
  const [combinedSuggestions, setCombinedSuggestions] = useState<ApiBookMetadata[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [autoFilledBadge, setAutoFilledBadge] = useState<{
    bookTitle: string;
    author: string;
    standardPages: number;
    genre: string;
    coverUrl?: string;
    source: string;
    isCustomPagesUsed: boolean;
  } | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live telemetry calculation
  const safePages = typeof totalPages === 'number' && totalPages > 0 ? totalPages : 1;
  const elapsedDays = calculateElapsedDays(startDate, finishDate);
  const livePpd = calculatePPD(safePages, elapsedDays);
  const liveArchetype = getArchetypeByPPD(livePpd);

  // Auto-fill applicant helper
  const applyBookMetadata = (
    book: ApiBookMetadata,
    userProvidedPages: boolean
  ) => {
    setTitle(book.title);
    setAuthor(book.author);
    if (book.genre || book.title) {
      setGenre(extractPrimaryGenre(book.genre || '', { title: book.title, author: book.author, fallback: 'Other / Custom' }));
    }
    if (book.coverUrl) setCoverUrl(book.coverUrl);
    if (book.isbn) setIsbn(book.isbn);
    if (book.publisher) setPublisher(book.publisher);
    if (book.publishedYear) setPublishedYear(book.publishedYear);

    // If the user already provided an exact page count, retain user's input!
    // Otherwise, auto-fill standard edition page count.
    if (!userProvidedPages) {
      setTotalPages(book.totalPages);
    }

    const sourceName =
      book.source === 'google_books'
        ? 'Google Books API'
        : book.source === 'open_library'
        ? 'Open Library API'
        : 'PagePace Literary Knowledge Base';

    setAutoFilledBadge({
      bookTitle: book.title,
      author: book.author,
      standardPages: book.totalPages,
      genre: book.genre,
      coverUrl: book.coverUrl,
      source: sourceName,
      isCustomPagesUsed: userProvidedPages,
    });
    setShowSuggestions(false);
  };

  // Monitor title / ISBN changes for suggestions and instant exact auto-fill
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newTitle.trim().length >= 2) {
      // 1. Instant local knowledge base match (0ms latency)
      const localResults = searchKnowledgeBase(newTitle).map((k): ApiBookMetadata => ({
        title: k.title,
        author: k.author,
        totalPages: k.totalPages,
        genre: k.genre,
        source: 'combined',
      }));

      // Check if user typed an exact match (e.g. "Fourth Wing")
      const exactMatch = findExactOrBestMatch(newTitle);
      if (exactMatch && exactMatch.title.toLowerCase() === newTitle.trim().toLowerCase()) {
        applyBookMetadata(
          {
            title: exactMatch.title,
            author: exactMatch.author,
            totalPages: exactMatch.totalPages,
            genre: exactMatch.genre,
            source: 'combined',
          },
          hasUserCustomizedPages
        );
      }

      setCombinedSuggestions(localResults);
      setShowSuggestions(localResults.length > 0);

      // 2. Debounced real Google Books API & Open Library API search
      setIsSearchingApi(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const apiResults = await searchBooksUnified(newTitle);
          if (apiResults.length > 0) {
            // Merge with local results, prioritizing rich API results with cover art
            const merged = [...apiResults];
            for (const loc of localResults) {
              if (!merged.some((m) => m.title.toLowerCase() === loc.title.toLowerCase())) {
                merged.push(loc);
              }
            }
            setCombinedSuggestions(merged);
            setShowSuggestions(true);

            // If user queried by ISBN and got an exact hit, auto-apply!
            if (isIsbnQuery(newTitle) && apiResults[0]) {
              applyBookMetadata(apiResults[0], hasUserCustomizedPages);
            }
          }
        } catch (err) {
          console.warn('API Search error:', err);
        } finally {
          setIsSearchingApi(false);
        }
      }, 400);
    } else {
      setCombinedSuggestions([]);
      setShowSuggestions(false);
      setIsSearchingApi(false);
    }
  };

  // When title input loses focus, check if we can auto-fill best match
  const handleTitleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (title.trim().length >= 3 && !author.trim()) {
        const match = findExactOrBestMatch(title);
        if (match) {
          applyBookMetadata(
            {
              title: match.title,
              author: match.author,
              totalPages: match.totalPages,
              genre: match.genre,
              source: 'combined',
            },
            hasUserCustomizedPages
          );
        }
      }
    }, 280);
  };

  const handlePageCountChange = (val: string) => {
    setHasUserCustomizedPages(true); // User explicitly provided page count!
    if (val === '') {
      setTotalPages('');
    } else {
      const num = Math.max(1, parseInt(val, 10) || 1);
      setTotalPages(num);
    }
    // Update badge state if active
    if (autoFilledBadge) {
      setAutoFilledBadge((prev) => (prev ? { ...prev, isCustomPagesUsed: true } : null));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const celebrationMessage = generateArchetypeCelebration({
      title: title.trim(),
      author: author.trim(),
      totalPages: safePages,
      elapsedDays,
      ppd: livePpd,
      archetypeId: liveArchetype.id,
      rating: snapToPrecision01(rating),
      review: review.trim(),
    });

    const newBook: BookEntry = {
      id: 'book-' + Date.now(),
      title: title.trim(),
      author: author.trim(),
      totalPages: safePages,
      startDate,
      finishDate,
      elapsedDays,
      ppd: livePpd,
      archetypeId: liveArchetype.id,
      rating: snapToPrecision01(rating),
      review: review.trim(),
      genre,
      format,
      coverUrl,
      isbn,
      publisher,
      publishedYear,
      celebrationMessage,
      createdAt: Date.now(),
    };

    // Gamified visual celebration
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: [liveArchetype.accentHex, '#f59e0b', '#38bdf8', '#ffffff'],
      });
    } catch {
      // Ignore confetti error if any
    }

    if (soundEnabled) {
      playCelebrationChime();
    }

    onBookCreated(newBook);
  };

  const genresList = MASTER_GENRES;

  const getArchetypeIcon = () => {
    switch (liveArchetype.id) {
      case 'narrative-comet':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'speed-reader':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'momentum-builder':
        return <Rocket className="w-5 h-5 text-emerald-400" />;
      case 'steady-cruiser':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'cozy-lounge-reader':
        return <Armchair className="w-5 h-5 text-blue-400" />;
      case 'book-sommelier':
        return <Wine className="w-5 h-5 text-pink-400" />;
      case 'bedtime-taster':
        return <Moon className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-Fill Banner Indicator with Cover Art and API Attribution */}
      {autoFilledBadge && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            {autoFilledBadge.coverUrl ? (
              <img
                src={autoFilledBadge.coverUrl}
                alt={autoFilledBadge.bookTitle}
                className="w-10 h-14 object-cover rounded shadow-md border border-stone-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-14 bg-stone-800 rounded border border-stone-700 flex items-center justify-center shrink-0 text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-300">
                  Auto-Filled via {autoFilledBadge.source}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Verified Library Metadata
                </span>
              </div>
              <p className="text-stone-300 font-mono text-xs">
                {autoFilledBadge.bookTitle} by {autoFilledBadge.author} ·{' '}
                {autoFilledBadge.isCustomPagesUsed ? (
                  <span className="text-amber-300 font-bold">
                    Custom {totalPages} pages (overriding standard {autoFilledBadge.standardPages} pages)
                  </span>
                ) : (
                  <span>{autoFilledBadge.standardPages} pages (standard edition)</span>
                )}{' '}
                · {autoFilledBadge.genre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoFilledBadge(null)}
            className="text-stone-400 hover:text-stone-200 p-1"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Book Metadata Fields with Google Books & Open Library Dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title / ISBN with Live Auto-Complete Dropdown */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
              <span>Book Title or ISBN <span className="text-amber-500">*</span></span>
              {isSearchingApi && (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              )}
            </label>
            <span className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Google Books & Open Library
            </span>
          </div>

          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => {
                if (title.trim().length >= 2 && combinedSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={handleTitleBlur}
              placeholder="e.g. Fourth Wing, Dune, or ISBN 9780593135204"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          {/* Instant Auto-Complete Dropdown */}
          {showSuggestions && combinedSuggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-stone-800 max-h-80 overflow-y-auto"
            >
              <div className="px-3 py-1.5 bg-stone-950 text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center justify-between sticky top-0 z-10 border-b border-stone-800">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Google Books & Open Library Results
                </span>
                <span>Click to Auto-Fill</span>
              </div>
              {combinedSuggestions.map((bk, i) => (
                <div
                  key={`${bk.title}-${bk.author}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur before click
                    applyBookMetadata(bk, hasUserCustomizedPages);
                  }}
                  className="p-3 hover:bg-stone-800/90 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {bk.coverUrl ? (
                      <img
                        src={bk.coverUrl}
                        alt={bk.title}
                        className="w-9 h-12 object-cover rounded shadow-sm border border-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-12 bg-stone-800 rounded border border-stone-700 flex items-center justify-center shrink-0 text-stone-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-serif font-bold text-stone-100 truncate">
                        {bk.title}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                        by {bk.author}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        <span className="text-amber-400/90">{bk.totalPages} pages</span>
                        <span> · {bk.genre}</span>
                        {bk.publisher && <span> · {bk.publisher}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    Auto-Fill
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Author Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Rebecca Yarros, Andy Weir"
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Pages & Dates (The Core Logic Formula Inputs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Page Count (With Custom Override Enforcement) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-300">
              Total Pages <span className="text-amber-500">*</span>
            </label>
            {hasUserCustomizedPages && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                User Custom Override
              </span>
            )}
          </div>
          <input
            type="number"
            required
            min={1}
            max={20000}
            value={totalPages}
            onChange={(e) => handlePageCountChange(e.target.value)}
            placeholder="512"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border text-stone-100 font-mono text-sm focus:outline-none transition-colors ${
              hasUserCustomizedPages
                ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
                : 'border-stone-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30'
            }`}
          />
          <div className="text-[11px] text-stone-500">
            {hasUserCustomizedPages
              ? 'Your exact input overrides standard edition pages.'
              : 'Auto-fills standard paperback/hardcover edition.'}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            Start Date <span className="text-amber-500">*</span>
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            Finish Date <span className="text-amber-500">*</span>
          </label>
          <input
            type="date"
            required
            value={finishDate}
            onChange={(e) => setFinishDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Live 7-Tier Velocity Telemetry Bar */}
      <VelocityTelemetryBar
        ppd={livePpd}
        elapsedDays={elapsedDays}
        totalPages={safePages}
      />

      {/* Rating Scale: 0.1 Precision */}
      <RatingInput
        value={rating}
        onChange={setRating}
        label="Your Rating (Fine-Tuned 0.1 Precision)"
      />

      {/* Format & Genre row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Reading Format</label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl">
            {(['Physical', 'E-Reader', 'Audiobook', 'Hybrid'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  format === fmt
                    ? 'bg-stone-800 text-stone-100 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Primary Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 transition-colors"
          >
            {genresList.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Review / Opinion */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-stone-300">
            Review & Opinion (Short Review)
          </label>
          <span className="text-[11px] text-stone-500">Included in celebration & social card</span>
        </div>
        <textarea
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What made this memorable? Plot twists, character arcs, prose style, or emotional resonance..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors leading-relaxed"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
      >
        <Sparkles className="w-5 h-5" />
        Complete Book & Generate Archetype Card
      </button>
    </form>
  );
};
