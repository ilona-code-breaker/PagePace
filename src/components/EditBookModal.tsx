import React, { useState, useEffect } from 'react';
import { BookEntry } from '../types/book';
import {
  calculateElapsedDays,
  calculatePPD,
  getArchetypeByPPD,
  snapToPrecision01,
} from '../utils/calculator';
import { generateArchetypeCelebration } from '../utils/celebrationGenerator';
import { RatingInput } from './RatingInput';
import { VelocityTelemetryBar } from './VelocityTelemetryBar';
import { ARCHETYPES } from '../constants/archetypes';
import {
  X,
  Check,
  Edit3,
  Calendar,
  Layers,
  BookOpen,
  Gauge,
  Sparkles,
  Zap,
  Compass,
  Wine,
  Moon,
  Tag,
} from 'lucide-react';

interface EditBookModalProps {
  book: BookEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBook: BookEntry) => void;
}

const COMMON_GENRES = [
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Horror',
  'Historical Fiction',
  'Literary Fiction',
  'Non-Fiction',
  'Classics',
  'YA Dystopian',
  'Young Adult',
  'Fiction',
  'Mystery',
  'Biography',
];

export const EditBookModal: React.FC<EditBookModalProps> = ({
  book,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !book) return null;

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author || '');
  const [totalPages, setTotalPages] = useState(book.totalPages || 350);
  const [startDate, setStartDate] = useState(book.startDate || '');
  const [finishDate, setFinishDate] = useState(book.finishDate || '');
  const [genre, setGenre] = useState(book.genre || 'Fiction');
  const [format, setFormat] = useState(book.format || 'Physical');
  const [rating, setRating] = useState(book.rating || 4.0);
  const [review, setReview] = useState(book.review || '');
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || '');

  // Reset form when book changes
  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author || '');
      setTotalPages(book.totalPages || 350);
      setStartDate(book.startDate || '');
      setFinishDate(book.finishDate || '');
      setGenre(book.genre || 'Fiction');
      setFormat(book.format || 'Physical');
      setRating(book.rating || 4.0);
      setReview(book.review || '');
      setCoverUrl(book.coverUrl || '');
    }
  }, [book]);

  // Live Recalculations
  const safePages = Math.max(1, totalPages || 1);
  const elapsedDays = calculateElapsedDays(startDate, finishDate);
  const ppd = calculatePPD(safePages, elapsedDays);
  const archetype = getArchetypeByPPD(ppd);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedBook: BookEntry = {
      ...book,
      title: title.trim(),
      author: author.trim(),
      totalPages: safePages,
      startDate,
      finishDate,
      elapsedDays,
      ppd,
      archetypeId: archetype.id,
      rating: snapToPrecision01(rating),
      genre: genre.trim() || 'Fiction',
      format,
      review: review.trim(),
      coverUrl: coverUrl.trim() || undefined,
      celebrationMessage: generateArchetypeCelebration({
        title: title.trim(),
        author: author.trim(),
        totalPages: safePages,
        elapsedDays,
        ppd,
        archetypeId: archetype.id,
        rating: snapToPrecision01(rating),
        review: review.trim(),
      }),
    };

    onSave(updatedBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 flex items-center gap-2">
                Edit Book Record
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Update book details, dates, or rating. PPD velocity and archetype will recalculate dynamically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Velocity & Archetype Telemetry Bar */}
        <VelocityTelemetryBar
          ppd={ppd}
          elapsedDays={elapsedDays}
          totalPages={safePages}
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title and Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Pages, Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Total Pages *
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalPages}
                onChange={(e) => setTotalPages(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Finish Date
              </label>
              <input
                type="date"
                required
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Genre and Reading Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Genre
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                >
                  {COMMON_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  {!COMMON_GENRES.includes(genre) && (
                    <option value={genre}>{genre}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Reading Format</label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-stone-950 border border-stone-800 rounded-xl">
                {(['Physical', 'E-Reader', 'Audiobook', 'Hybrid'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      format === fmt
                        ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rating Input with 0.1 Precision */}
          <div className="space-y-1.5 pt-1">
            <RatingInput
              value={rating}
              onChange={setRating}
              label="Star Rating (0.1 Precision)"
            />
          </div>

          {/* Review / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">
              Personal Review / Notes
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What made this read special or memorable?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Cover Art URL (optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-400">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://covers.openlibrary.org/..."
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs font-mono focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Recalculate Velocity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
