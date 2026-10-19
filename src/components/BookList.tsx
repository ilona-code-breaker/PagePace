import React, { useState, useMemo, useEffect } from 'react';
import { BookEntry, ArchetypeId, MonthlyGoal } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { DataPortabilityToolbar } from './DataPortabilityToolbar';
import { GenrePieChart } from './GenrePieChart';
import { EditBookModal } from './EditBookModal';
import { GenreBadge } from './GenreBadge';
import { MASTER_GENRES, GENRE_METADATA, MasterGenre } from '../utils/genreMapper';
import { playCelebrationChime, playSoftClick } from '../utils/sound';
import {
  Search,
  Filter,
  Tag,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Gauge,
  Star,
  Zap,
  Compass,
  Wine,
  Moon,
  Flame,
  Rocket,
  Armchair,
  Trash2,
  Share2,
  X,
  Sparkles,
  Edit3,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Check,
  CheckSquare,
  Square,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface BookListProps {
  books: BookEntry[];
  goals?: Record<string, MonthlyGoal>;
  onSelectBook: (book: BookEntry) => void;
  onDeleteBook: (id: string) => void;
  onDeleteBooks?: (ids: string[]) => void;
  onClearLibrary?: () => void;
  onRestoreBooks?: (booksToRestore: BookEntry[]) => void;
  soundEnabled?: boolean;
  onAddBookClick: () => void;
  onDataImported?: (data: { books: BookEntry[]; goals: Record<string, MonthlyGoal> }) => void;
  onOpenShareCard?: () => void;
  onEditBook?: (updatedBook: BookEntry) => void;
}

interface DeletionAction {
  id: string;
  books: BookEntry[];
  label: string;
  timestamp: number;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  goals = {},
  onSelectBook,
  onDeleteBook,
  onDeleteBooks,
  onClearLibrary,
  onRestoreBooks,
  soundEnabled = true,
  onAddBookClick,
  onDataImported,
  onOpenShareCard,
  onEditBook,
}) => {
  const [search, setSearch] = useState('');
  const [filterArchetype, setFilterArchetype] = useState<ArchetypeId | 'all'>('all');
  const [filterGenre, setFilterGenre] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'ppd' | 'rating'>('date');
  const [showGenreChart, setShowGenreChart] = useState(true);
  const [editingBook, setEditingBook] = useState<BookEntry | null>(null);

  // Multi-Selection State
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

  // Clear Library Modal State
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);

  // Undo Deletion Toast State
  const [activeUndo, setActiveUndo] = useState<DeletionAction | null>(null);
  const [undoProgress, setUndoProgress] = useState<number>(100);
  const [isUndoHovered, setIsUndoHovered] = useState<boolean>(false);
  const [restoredFlashMessage, setRestoredFlashMessage] = useState<string | null>(null);

  // Undo 10-second countdown timer
  useEffect(() => {
    if (!activeUndo) {
      setUndoProgress(100);
      return;
    }

    if (isUndoHovered) return;

    const interval = setInterval(() => {
      setUndoProgress((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveUndo(null);
          return 0;
        }
        return prev - 1; // 100 steps * 100ms = 10,000ms = 10s
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeUndo, isUndoHovered]);

  // Compute unique genres with count breakdown present in user's library
  const libraryGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      const primary = b.genre?.trim();
      if (primary) {
        counts[primary] = (counts[primary] || 0) + 1;
      }
      if (b.genres && b.genres.length > 0) {
        b.genres.forEach((g) => {
          if (g !== primary) {
            counts[g] = (counts[g] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books
      .filter((b) => {
        // Multi-attribute search
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchAuthor = b.author ? b.author.toLowerCase().includes(q) : false;
        const matchGenre = b.genre ? b.genre.toLowerCase().includes(q) : false;
        const matchGenresArr = b.genres ? b.genres.some((g) => g.toLowerCase().includes(q)) : false;
        const matchSearch = q === '' || matchTitle || matchAuthor || matchGenre || matchGenresArr;

        const matchArch = filterArchetype === 'all' || b.archetypeId === filterArchetype;

        // Dedicated Genre Filter (supports Unassigned and specific genres)
        const matchGenreFilter =
          filterGenre === 'all' ||
          (b.genre ? b.genre.toLowerCase() === filterGenre.toLowerCase() : false) ||
          (b.genres ? b.genres.some((g) => g.toLowerCase() === filterGenre.toLowerCase()) : false);

        return matchSearch && matchArch && matchGenreFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'ppd') return b.ppd - a.ppd;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default: date (newest finished first)
        return (
          new Date(b.finishDate).getTime() - new Date(a.finishDate).getTime() ||
          b.createdAt - a.createdAt
        );
      });
  }, [books, search, filterArchetype, filterGenre, sortBy]);

  // Clean up selection when books are deleted or filtered
  useEffect(() => {
    if (selectedBookIds.size === 0) return;
    const existingIds = new Set(books.map((b) => b.id));
    setSelectedBookIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (existingIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [books]);

  // Selection toggle helper
  const toggleSelectBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEnabled) playSoftClick();
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered books or deselect all
  const handleSelectAllToggle = () => {
    if (soundEnabled) playSoftClick();
    if (selectedBookIds.size === filtered.length && filtered.length > 0) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(filtered.map((b) => b.id)));
    }
  };

  // 1. Single Delete handler (preserves individual button, activates undo)
  const handleDeleteSingle = (book: BookEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEnabled) playSoftClick();

    // Set active undo action
    setActiveUndo({
      id: crypto.randomUUID(),
      books: [book],
      label: `Deleted "${book.title}"`,
      timestamp: Date.now(),
    });
    setUndoProgress(100);

    // Remove from selection if present
    setSelectedBookIds((prev) => {
      if (!prev.has(book.id)) return prev;
      const next = new Set(prev);
      next.delete(book.id);
      return next;
    });

    onDeleteBook(book.id);
  };

  // 2. Batch Delete handler (multiple selected books, activates undo)
  const handleDeleteSelected = () => {
    if (selectedBookIds.size === 0) return;
    if (soundEnabled) playSoftClick();

    const booksToDelete = books.filter((b) => selectedBookIds.has(b.id));
    if (booksToDelete.length === 0) return;

    setActiveUndo({
      id: crypto.randomUUID(),
      books: booksToDelete,
      label: `Deleted ${booksToDelete.length} ${booksToDelete.length === 1 ? 'book' : 'books'}`,
      timestamp: Date.now(),
    });
    setUndoProgress(100);

    const idsArray = Array.from(selectedBookIds);
    if (onDeleteBooks) {
      onDeleteBooks(idsArray);
    } else {
      idsArray.forEach((id) => onDeleteBook(id));
    }

    setSelectedBookIds(new Set());
  };

  // 3. Clear Entire Library handler (activates undo)
  const handleConfirmClearLibrary = () => {
    if (books.length === 0) return;
    if (soundEnabled) playSoftClick();

    const booksToClear = [...books];

    setActiveUndo({
      id: crypto.randomUUID(),
      books: booksToClear,
      label: `Cleared entire library (${booksToClear.length} ${booksToClear.length === 1 ? 'book' : 'books'})`,
      timestamp: Date.now(),
    });
    setUndoProgress(100);

    if (onClearLibrary) {
      onClearLibrary();
    } else if (onDeleteBooks) {
      onDeleteBooks(booksToClear.map((b) => b.id));
    } else {
      booksToClear.forEach((b) => onDeleteBook(b.id));
    }

    setSelectedBookIds(new Set());
    setIsClearConfirmOpen(false);
  };

  // 4. Undo Handler (restores deleted books back to library)
  const handleUndo = () => {
    if (!activeUndo) return;

    if (onRestoreBooks) {
      onRestoreBooks(activeUndo.books);
    }

    if (soundEnabled) {
      playCelebrationChime();
    }

    const restoredCount = activeUndo.books.length;
    setRestoredFlashMessage(`Restored ${restoredCount} ${restoredCount === 1 ? 'book' : 'books'} to library!`);
    setTimeout(() => {
      setRestoredFlashMessage(null);
    }, 3500);

    setActiveUndo(null);
  };

  const getArchetypeIcon = (id: ArchetypeId) => {
    switch (id) {
      case 'narrative-comet':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'speed-reader':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'momentum-builder':
        return <Rocket className="w-4 h-4 text-emerald-400" />;
      case 'steady-cruiser':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'cozy-lounge-reader':
        return <Armchair className="w-4 h-4 text-blue-400" />;
      case 'book-sommelier':
        return <Wine className="w-4 h-4 text-pink-400" />;
      case 'bedtime-taster':
        return <Moon className="w-4 h-4 text-violet-400" />;
    }
  };

  const renderHighlighted = (text: string | undefined, query: string) => {
    if (!text) return '';
    if (!query.trim()) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === query.trim().toLowerCase() ? (
              <mark key={i} className="bg-amber-500/30 text-amber-200 px-0.5 rounded">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Utility Bar: Data Portability, Clear Library & Share Card Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-stone-400 flex-wrap">
          <span className="font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Library State:
          </span>
          <span className="font-mono text-stone-200 font-bold">{books.length} Books</span>

          <button
            type="button"
            onClick={() => setShowGenreChart((prev) => !prev)}
            className="ml-2 px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-stone-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <PieChartIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>{showGenreChart ? 'Hide Genre Chart' : 'Show Genre Chart'}</span>
            {showGenreChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Data Portability Controls (Export / Import JSON & CSV) */}
          {onDataImported && (
            <DataPortabilityToolbar
              books={books}
              goals={goals}
              onDataImported={onDataImported}
            />
          )}

          {/* Share Archetype Card CTA */}
          {onOpenShareCard && (
            <button
              type="button"
              onClick={onOpenShareCard}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Share Archetype Card</span>
            </button>
          )}

          {/* Clear Library Button ("all at one 'Clear library' button") */}
          {books.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Clear all books from your library (undo available)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Library</span>
            </button>
          )}
        </div>
      </div>

      {/* Genre Visual Distribution Chart */}
      {showGenreChart && (
        <GenrePieChart
          books={books}
          selectedGenre={filterGenre}
          onSelectGenre={(g) => setFilterGenre(g)}
        />
      )}

      {/* Search, Filter, Sort and Selection Controls */}
      <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or genre tags..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Archetype Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Archetype:
              </span>
              <select
                value={filterArchetype}
                onChange={(e) => setFilterArchetype(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Archetypes</option>
                {Object.values(ARCHETYPES).map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    {arch.name} ({arch.ppdRange} PPD)
                  </option>
                ))}
              </select>
            </div>

            {/* Dedicated Genre Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Genre:
              </span>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Genres</option>
                {libraryGenres.length > 0 && (
                  <optgroup label="Library Shelves">
                    {libraryGenres.map(([g, count]) => (
                      <option key={g} value={g}>
                        {g} ({count})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Standard Categories">
                  {MASTER_GENRES.map((mg) => (
                    <option key={mg} value={mg}>
                      {mg}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Sort Menu */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="date">Date Finished</option>
                <option value="ppd">Pace (Highest PPD)</option>
                <option value="rating">Rating (Highest)</option>
              </select>
            </div>

            {/* Select All / Deselect Toggle */}
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                  selectedBookIds.size > 0
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="Select or deselect all visible books"
              >
                {selectedBookIds.size === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-500" />
                )}
                <span>
                  {selectedBookIds.size === filtered.length && filtered.length > 0
                    ? 'Deselect All'
                    : `Select All (${filtered.length})`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Genre Filter Pills (Interactive One-Tap Filters with Unassigned support) */}
        {libraryGenres.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 border-t border-stone-800/40 text-xs custom-scrollbar pb-0.5">
            <span className="text-[11px] text-stone-500 uppercase font-mono tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-stone-500" />
              Quick Genre:
            </span>
            <button
              type="button"
              onClick={() => setFilterGenre('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterGenre === 'all'
                  ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All
            </button>
            {libraryGenres.map(([g, count]) => {
              const isSelected = filterGenre === g;
              const meta = GENRE_METADATA[g as MasterGenre] || GENRE_METADATA['Unassigned'];
              const isUnassignedPill = g === 'Unassigned';

              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGenre(isSelected ? 'all' : g)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-400 font-semibold shadow-sm'
                      : isUnassignedPill
                      ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 border border-amber-500/30'
                      : 'bg-stone-950/70 text-stone-400 hover:text-stone-200 border border-stone-800/80 hover:border-stone-700'
                  }`}
                  title={`Filter library by ${g}`}
                >
                  {meta?.emoji && <span className="text-[11px]">{meta.emoji}</span>}
                  <span>{g}</span>
                  <span className="text-[10px] font-mono text-stone-500">({count})</span>
                  {isSelected && <span className="text-amber-400 text-[10px] ml-0.5">✕</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Multi-Select Action Bar ("select multiple to delete") */}
      {selectedBookIds.size > 0 && (
        <div className="sticky top-20 z-30 mx-auto max-w-xl w-full p-3 rounded-2xl bg-stone-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
              {selectedBookIds.size}
            </span>
            <span className="text-xs text-stone-200 font-medium">
              {selectedBookIds.size === 1 ? 'book' : 'books'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedBookIds(new Set())}
              className="px-2.5 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedBookIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Restored Success Toast Flash */}
      {restoredFlashMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{restoredFlashMessage}</span>
        </div>
      )}

      {/* Book Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 space-y-4">
          <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-200">
              {search && filterGenre !== 'all'
                ? `No books matching "${search}" in ${filterGenre}`
                : filterGenre !== 'all'
                ? `No books found in genre "${filterGenre}"`
                : search
                ? `No books matching "${search}"`
                : 'No books found'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
              {search || filterGenre !== 'all' || filterArchetype !== 'all'
                ? 'We could not find any books matching your selected filters. Try broadening your query or clearing specific genre/archetype filters.'
                : 'Try adjusting your archetype filter, or track a new completed book!'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            {filterGenre !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterGenre('all')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Clear Genre ({filterGenre})</span>
              </button>
            )}
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors"
              >
                Clear Search Query
              </button>
            )}
            {(search || filterGenre !== 'all' || filterArchetype !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterGenre('all');
                  setFilterArchetype('all');
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs transition-colors"
              >
                Reset All Filters
              </button>
            )}
            <button
              type="button"
              onClick={onAddBookClick}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
            >
              Track a New Book
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((book) => {
            const arch = ARCHETYPES[book.archetypeId] || ARCHETYPES['steady-cruiser'];
            const isSelected = selectedBookIds.has(book.id);

            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className={`group p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative shadow-md ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500/60 ring-2 ring-amber-500/40 shadow-xl'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                {/* Header Metadata with Multi-Select Checkbox */}
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Multi-Selection Checkbox ("select multiple to delete") */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectBook(book.id, e)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400 font-bold shadow-sm'
                          : 'bg-stone-950/80 border border-stone-700 text-transparent hover:border-amber-400 hover:text-stone-400'
                      }`}
                      title={isSelected ? 'Deselect book' : 'Select book for batch actions'}
                      aria-label={isSelected ? 'Deselect book' : 'Select book'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                      {getArchetypeIcon(book.archetypeId)}
                      {arch.shortName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{book.ppd.toFixed(1)} PPD</span>

                    <span aria-hidden="true">·</span>

                    {/* Quick One-Click Reassignable Genre Badge (with Unassigned support) */}
                    <GenreBadge
                      currentGenre={book.genre || 'Unassigned'}
                      onGenreChange={(newGenre) => {
                        if (onEditBook) {
                          onEditBook({
                            ...book,
                            genre: newGenre,
                            genres: [newGenre],
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-400 shrink-0">
                    <span className="font-mono text-amber-400 font-bold">
                      ★ {book.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-stone-500">/ 5.0</span>
                  </div>
                </div>

                {/* Title and Author with Highlight support & Cover Thumbnail */}
                <div className="flex items-start gap-3.5">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded-lg shadow-md border border-stone-800 shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0 text-stone-500">
                      <BookOpen className="w-5 h-5 text-stone-600" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-serif font-bold text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                      {renderHighlighted(book.title, search)}
                    </h4>
                    {book.author && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                        by {renderHighlighted(book.author, search)}
                      </p>
                    )}
                    <p className="text-xs font-serif italic text-stone-400 line-clamp-1 mt-1">
                      “{arch.tagline}”
                    </p>
                  </div>
                </div>

                {/* Review Snippet if present */}
                {book.review && (
                  <p className="text-xs text-stone-300 italic line-clamp-2 pl-2 border-l-2 border-stone-800">
                    "{book.review}"
                  </p>
                )}

                {/* Card Footer with In-App Edit Button & Individual Delete Button ("keeping individual buttons") */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    {book.totalPages} pages · {book.elapsedDays} {book.elapsedDays === 1 ? 'day' : 'days'}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* In-App Edit Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBook(book);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-amber-300 text-xs font-medium transition-colors flex items-center gap-1 border border-stone-750"
                      title="Edit book details"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400" />
                      <span>Edit</span>
                    </button>

                    <span className="text-amber-400 group-hover:underline font-medium">
                      Certificate →
                    </span>

                    {/* Individual Delete Button ("keeping individual buttons") */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(book, e)}
                      className="p-1 rounded-lg text-stone-600 hover:text-rose-400 transition-colors"
                      title="Delete book (undo available)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Undo Notification Toast Banner ("we also allow undo deletion") */}
      {activeUndo && (
        <div
          onMouseEnter={() => setIsUndoHovered(true)}
          onMouseLeave={() => setIsUndoHovered(false)}
          className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto p-4 rounded-2xl bg-stone-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 animate-in slide-in-from-bottom-5 duration-200"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-200 truncate">{activeUndo.label}</p>
                <p className="text-[10px] text-stone-400">Click Undo within 10s to restore</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndo}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveUndo(null)}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-300 transition-colors"
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-stone-800/80 rounded-full h-1 overflow-hidden">
            <div
              className="bg-amber-400 h-1 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${undoProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Clear Entire Library Confirmation Modal ("all at one 'Clear library' button") */}
      {isClearConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsClearConfirmOpen(false)}
        >
          <div
            className="max-w-md w-full p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-serif font-bold text-stone-100">
                Clear Entire Reading Archive?
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                This will remove all <span className="text-amber-400 font-mono font-bold">{books.length}</span> books from your library.
                Don't worry—you can immediately undo this action using the undo prompt.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-stone-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearLibrary}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-rose-600/30 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All ({books.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Book Edit Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen={!!editingBook}
          onClose={() => setEditingBook(null)}
          onSave={(updated) => {
            onEditBook?.(updated);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
};
