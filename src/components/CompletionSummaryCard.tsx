import React, { useState } from 'react';
import { BookEntry, ArchetypeDefinition } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { generateSocialCaptionSnippet } from '../utils/socialCardGenerator';
import { StoryCardCanvas } from './StoryCardCanvas';
import {
  Calendar,
  Clock,
  Gauge,
  Star,
  Quote,
  Share2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  Compass,
  Wine,
  Moon,
  Zap,
  Info,
  X,
} from 'lucide-react';

interface CompletionSummaryCardProps {
  book: BookEntry;
  onClose?: () => void;
  onEdit?: (book: BookEntry) => void;
}

export const CompletionSummaryCard: React.FC<CompletionSummaryCardProps> = ({
  book,
  onClose,
}) => {
  const archetype: ArchetypeDefinition = ARCHETYPES[book.archetypeId] || ARCHETYPES['steady-cruiser'];
  const [activeTab, setActiveTab] = useState<'summary' | 'caption' | 'visualCard'>('summary');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(book.celebrationMessage || null);
  const [isEnhancedBadge, setIsEnhancedBadge] = useState(Boolean(book.isAiEnhanced));

  const captionSnippet = generateSocialCaptionSnippet(book, archetype);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionSnippet);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleEnhanceWithGemini = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/archetype-celebration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          totalPages: book.totalPages,
          elapsedDays: book.elapsedDays,
          ppd: book.ppd,
          archetype: archetype.name,
          rating: book.rating,
          review: book.review,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.message) {
          setAiMessage(data.message);
          if (data.enhanced) {
            setIsEnhancedBadge(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to enhance with Gemini:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderArchetypeIcon = () => {
    switch (book.archetypeId) {
      case 'speed-reader':
        return <Zap className="w-8 h-8 text-amber-400" />;
      case 'steady-cruiser':
        return <Compass className="w-8 h-8 text-emerald-400" />;
      case 'book-sommelier':
        return <Wine className="w-8 h-8 text-purple-400" />;
      case 'bedtime-taster':
        return <Moon className="w-8 h-8 text-sky-400" />;
    }
  };

  const getBorderColorClass = () => {
    switch (book.archetypeId) {
      case 'speed-reader':
        return 'border-amber-500/30 shadow-amber-500/10';
      case 'steady-cruiser':
        return 'border-emerald-500/30 shadow-emerald-500/10';
      case 'book-sommelier':
        return 'border-purple-500/30 shadow-purple-500/10';
      case 'bedtime-taster':
        return 'border-sky-500/30 shadow-sky-500/10';
    }
  };

  const getPillBadgeStyle = () => {
    switch (book.archetypeId) {
      case 'speed-reader':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'steady-cruiser':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'book-sommelier':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'bedtime-taster':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    }
  };

  return (
    <div className={`relative bg-stone-900/95 border ${getBorderColorClass()} shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md`}>
      {/* Top Banner & Header */}
      <div className="relative p-6 sm:p-8 pb-4 border-b border-stone-800">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Close card"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Quiet Meta Kicker (No Pill Enclosure per Frontend Design Constitution) */}
        <div className="flex items-center gap-2 text-xs text-stone-400 mb-2 tracking-wide font-medium">
          <span className="uppercase text-stone-500">Completion Certificate</span>
          <span aria-hidden="true">·</span>
          <span>Finished {book.finishDate}</span>
          {book.format && (
            <>
              <span aria-hidden="true">·</span>
              <span>{book.format}</span>
            </>
          )}
          {book.genre && (
            <>
              <span aria-hidden="true">·</span>
              <span>{book.genre}</span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-xl shadow-lg border border-stone-700/80 shrink-0"
              />
            ) : (
              <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0 text-stone-500">
                <BookOpen className="w-7 h-7 text-stone-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight">
                {book.title}
              </h2>
              {book.author && (
                <p className="text-stone-400 text-sm mt-0.5">by {book.author}</p>
              )}
              {(book.publisher || book.isbn) && (
                <p className="text-[11px] text-stone-500 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                  {book.publisher && <span>{book.publisher}</span>}
                  {book.publisher && book.isbn && <span>·</span>}
                  {book.isbn && <span>ISBN: {book.isbn}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Archetype Insignia Box */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-stone-800 p-3 rounded-xl sm:self-start">
            <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
              {renderArchetypeIcon()}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
                Reading Archetype
              </div>
              <div className="text-base font-bold text-stone-100">
                {archetype.name}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                {archetype.ppdRange}
              </div>
            </div>
          </div>
        </div>

        {/* Archetype Official Tagline */}
        <div className="mt-4 pt-4 border-t border-stone-800/60 flex items-baseline gap-2">
          <span className="text-stone-500 font-serif italic text-sm">Verdict:</span>
          <span className="font-serif italic text-stone-200 font-medium text-sm sm:text-base">
            “{archetype.tagline}”
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 p-1 bg-stone-950/80 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'summary'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Summary & Celebration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('caption')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'caption'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Story Caption
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visualCard')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'visualCard'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Visual Card (PNG)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {activeTab === 'summary' && (
          <>
            {/* 4 Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium mb-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  Elapsed Days
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-stone-100">
                  {book.elapsedDays}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {book.elapsedDays === 1 ? '1 calendar day' : `${book.elapsedDays} total days`}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium mb-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                  Velocity (PPD)
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">
                  {book.ppd.toFixed(1)}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">Pages Per Day</div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                  Total Pages
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-stone-100">
                  {book.totalPages}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">Pages Completed</div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Rating (0.2 Prec.)
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">
                  {book.rating.toFixed(1)}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">out of 5.0</div>
              </div>
            </div>

            {/* Personalized Archetype Celebration Message */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-950/90 to-stone-900/90 border border-stone-800 relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{archetype.badgeEmoji}</span>
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-300">
                    Archetype Celebration & Style Validation
                  </span>
                  {isEnhancedBadge && (
                    <span className="text-[10px] font-mono text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10">
                      Gemini Muse
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEnhanceWithGemini}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
                  title="Generate a bespoke literary celebration via Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAiLoading ? 'Crafting Tribute...' : 'Polish with Gemini'}
                </button>
              </div>

              <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-sans">
                {aiMessage}
              </p>

              <div className="text-xs text-stone-400 pt-2 border-t border-stone-800/60 italic">
                💡 <strong className="text-stone-300 not-italic">Philosophy:</strong> {archetype.celebrationPhilosophy}
              </div>
            </div>

            {/* Reader's Review / Opinion Quote */}
            {book.review && (
              <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-stone-400">
                  <Quote className="w-3.5 h-3.5 text-stone-500" />
                  Reader Opinion
                </div>
                <p className="text-sm font-serif italic text-stone-300 leading-relaxed pl-2 border-l-2 border-stone-700">
                  “{book.review}”
                </p>
              </div>
            )}

            {/* Quick Share Action Row */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-stone-500">
                Dates: <span className="text-stone-300">{book.startDate}</span> to <span className="text-stone-300">{book.finishDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('caption')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Get Story Caption
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('visualCard')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Story Graphic
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Shareable Social Card Snippet */}
        {activeTab === 'caption' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-100">
                  Social Card Snippet for Instagram & TikTok
                </h3>
                <p className="text-xs text-stone-400">
                  Formatted with hook, emojis, pace breakdown, and BookTok tags.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 sm:p-5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto selection:bg-amber-500/30 selection:text-amber-200">
                {captionSnippet}
              </pre>
            </div>

            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
              <span>Ready to paste directly into your Instagram Story, Reels, or TikTok video caption!</span>
              <button
                type="button"
                onClick={() => setActiveTab('visualCard')}
                className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                Need the graphic too? <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Visual Canvas Card Export */}
        {activeTab === 'visualCard' && (
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-semibold text-stone-100">
                Visual Story Card Generator
              </h3>
              <p className="text-xs text-stone-400">
                Export a high-resolution story card (9:16) or square post (1:1) to share on social media.
              </p>
            </div>

            <StoryCardCanvas book={book} archetype={archetype} />
          </div>
        )}
      </div>
    </div>
  );
};
