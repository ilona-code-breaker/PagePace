import React, { useState, useMemo } from 'react';
import { BookEntry, ArchetypeId, MonthlyGoal } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { DataPortabilityToolbar } from './DataPortabilityToolbar';
import { GenrePieChart } from './GenrePieChart';
import { EditBookModal } from './EditBookModal';
import {
  Search,
  Filter,
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
} from 'lucide-react';

interface BookListProps {
  books: BookEntry[];
  goals?: Record<string, MonthlyGoal>;
  onSelectBook: (book: BookEntry) => void;
  onDeleteBook: (id: string) => void;
  onAddBookClick: () => void;
  onDataImported?: (data: { books: BookEntry[]; goals: Record<string, MonthlyGoal> }) => void;
  onOpenShareCard?: () => void;
  onEditBook?: (updatedBook: BookEntry) => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  goals = {},
  onSelectBook,
  onDeleteBook,
  onAddBookClick,
  onDataImported,
  onOpenShareCard,
  onEditBook,
}) => {
  const [search, setSearch] = useState('');
  const [filterArchetype, setFilterArchetype] = useState<ArchetypeId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'ppd' | 'rating'>('date');
  const [showGenreChart, setShowGenreChart] = useState(true);
  const [editingBook, setEditingBook] = useState<BookEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books
      .filter((b) => {
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchAuthor = b.author ? b.author.toLowerCase().includes(q) : false;
        const matchSearch = q === '' || matchTitle || matchAuthor;

        const matchArch = filterArchetype === 'all' || b.archetypeId === filterArchetype;
        return matchSearch && matchArch;
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
  }, [books, search, filterArchetype, sortBy]);

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

  // Helper to highlight search query within text
  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.trim()})`, 'gi'));
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
  };

  return (
    <div className="space-y-6">
      {/* Top Utility Bar: Data Portability & Share Card Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-stone-400">
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
        </div>
      </div>

      {/* 1. Recharts Genre Pie Chart Component */}
      {showGenreChart && (
        <GenrePieChart books={books} />
      )}

      {/* Prominent Library Search & Filter Controls Bar */}
      <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4 shadow-sm">
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library by title or author (e.g. Andy Weir, Fourth Wing, Tomorrow)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Status / Match Count Badge */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-stone-400 shrink-0 font-mono">
            {search ? (
              <span className="px-2.5 py-1.5 rounded-lg bg-stone-950 border border-amber-500/30 text-amber-300">
                Found {filtered.length} of {books.length} {filtered.length === 1 ? 'match' : 'matches'}
              </span>
            ) : (
              <span className="px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-400">
                {books.length} {books.length === 1 ? 'book' : 'books'} archived
              </span>
            )}
          </div>
        </div>

        {/* Secondary Row: Archetype Filter & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-stone-800/60">
          {/* Filter by Archetype (All 7 Tiers) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-stone-500 uppercase font-mono tracking-wider mr-1 shrink-0">
              Archetype:
            </span>
            <button
              type="button"
              onClick={() => setFilterArchetype('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterArchetype === 'all'
                  ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('narrative-comet')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'narrative-comet'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" />
              Narrative Comet
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('speed-reader')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'speed-reader'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Speed Reader
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('momentum-builder')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'momentum-builder'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Rocket className="w-3 h-3 text-emerald-400" />
              Momentum
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('steady-cruiser')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'steady-cruiser'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              Steady Cruiser
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('cozy-lounge-reader')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'cozy-lounge-reader'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Armchair className="w-3 h-3 text-blue-400" />
              Cozy Lounge
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('book-sommelier')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'book-sommelier'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Wine className="w-3 h-3 text-pink-400" />
              Sommelier
            </button>
            <button
              type="button"
              onClick={() => setFilterArchetype('bedtime-taster')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterArchetype === 'bedtime-taster'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Moon className="w-3 h-3 text-violet-400" />
              Bedtime Taster
            </button>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
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
        </div>
      </div>

      {/* Book Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 space-y-4">
          <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-200">
              {search ? `No books matching "${search}"` : 'No books found'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
              {search
                ? 'We could not find any books matching that title or author. Try a different keyword or clear the search filter.'
                : 'Try adjusting your archetype filter, or track a new completed book!'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors"
              >
                Clear Search Query
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
            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="group p-5 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 hover:bg-stone-900 transition-all cursor-pointer space-y-3 relative shadow-md"
              >
                {/* Header Metadata */}
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                      {getArchetypeIcon(book.archetypeId)}
                      {arch.shortName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{book.ppd.toFixed(1)} PPD</span>
                    {book.genre && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[11px] font-mono text-stone-400 px-1.5 py-0.2 rounded bg-stone-950 border border-stone-800">
                          {book.genre}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-400">
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

                {/* Card Footer with In-App Edit Button */}
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBook(book.id);
                      }}
                      className="p-1 rounded-lg text-stone-600 hover:text-rose-400 transition-colors"
                      title="Delete book"
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
