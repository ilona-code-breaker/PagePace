import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { BookEntry, MonthlyGoal } from '../types/book';
import {
  calculateMonthProgress,
  getAdjacentMonthKey,
  getBooksForMonth,
  getCurrentMonthKey,
  formatMonthLabel,
} from '../utils/goalUtils';
import { ARCHETYPES } from '../constants/archetypes';
import { GoalEditModal } from './GoalEditModal';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  BookOpen,
  Layers,
  Calendar,
  Sparkles,
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  Edit3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface MonthlyGoalTrackerProps {
  books: BookEntry[];
  goals: Record<string, MonthlyGoal>;
  onUpdateGoal: (goal: MonthlyGoal) => void;
  onSelectBook: (book: BookEntry) => void;
  onNavigateToTrack: () => void;
  soundEnabled?: boolean;
}

export const MonthlyGoalTracker: React.FC<MonthlyGoalTrackerProps> = ({
  books,
  goals,
  onUpdateGoal,
  onSelectBook,
  onNavigateToTrack,
  soundEnabled,
}) => {
  const currentKey = getCurrentMonthKey();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentKey);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [metricView, setMetricView] = useState<'both' | 'books' | 'pages'>('both');

  // Retrieve or create default goal for selected month
  const activeGoal: MonthlyGoal = goals[selectedMonthKey] || {
    monthKey: selectedMonthKey,
    targetType: 'both',
    targetBooks: 3,
    targetPages: 1000,
    intention: 'Consistent daily reading & joyful book exploration',
  };

  const progress = calculateMonthProgress(selectedMonthKey, activeGoal, books);
  const monthBooks = getBooksForMonth(books, selectedMonthKey);

  const handlePrevMonth = () => {
    setSelectedMonthKey((prev) => getAdjacentMonthKey(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonthKey((prev) => getAdjacentMonthKey(prev, 1));
  };

  const handleTriggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#10b981', '#a855f7', '#38bdf8', '#ffffff'],
      });
    } catch {
      // Ignore
    }
  };

  const getPaceStatusBadge = () => {
    switch (progress.paceStatus) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            <Trophy className="w-3.5 h-3.5" />
            Monthly Goal Smashed!
          </span>
        );
      case 'ahead':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            Ahead of Schedule 🔥
          </span>
        );
      case 'on_track':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            On Track & Steady
          </span>
        );
      case 'behind':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Pick Up the Pace
          </span>
        );
      case 'past_missed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 bg-stone-800 px-3 py-1 rounded-full">
            Month Concluded
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Month Navigation & Target Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-3 py-1 text-center min-w-[160px]">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
              {progress.monthLabel}
            </h2>
            <div className="text-[11px] text-stone-400 font-mono mt-0.5">
              {progress.isCurrentMonth ? (
                <span>Day {progress.currentDayOfMonth} of {progress.totalDaysInMonth} · {progress.daysRemaining} days left</span>
              ) : progress.isPastMonth ? (
                <span>Archived Month · Completed</span>
              ) : (
                <span>Upcoming Month</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!progress.isCurrentMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonthKey(currentKey)}
              className="ml-2 text-xs px-2.5 py-1.5 rounded-lg bg-stone-800 text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Current Month
            </button>
          )}
        </div>

        {/* Edit Goal & Metric Filter */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Metric View Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setMetricView('both')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                metricView === 'both'
                  ? 'bg-stone-800 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Both
            </button>
            <button
              type="button"
              onClick={() => setMetricView('books')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                metricView === 'books'
                  ? 'bg-stone-800 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Books
            </button>
            <button
              type="button"
              onClick={() => setMetricView('pages')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                metricView === 'pages'
                  ? 'bg-stone-800 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Pages
            </button>
          </div>

          {/* Edit Target Button */}
          <button
            type="button"
            onClick={() => setIsEditingGoal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Goal
          </button>
        </div>
      </div>

      {/* Main Goal Progress Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Progress Card (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Backing */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-20"
            style={{
              background: progress.isGoalMet ? '#10b981' : '#f59e0b',
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-400">
                <Target className="w-4 h-4 text-amber-400" />
                Monthly Target Fulfillment
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 mt-1">
                Progress Overview
              </h3>
            </div>
            <div>{getPaceStatusBadge()}</div>
          </div>

          {/* Dual Progress Gauges */}
          <div className="space-y-6 pt-2">
            {/* 1. Books Progress Bar */}
            {(metricView === 'both' || metricView === 'books') && (
              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    Books Completed
                  </span>
                  <div className="font-mono text-sm">
                    <span className="font-bold text-stone-100">{progress.booksRead}</span>
                    <span className="text-stone-500"> / {progress.targetBooks} books</span>
                    <span className="text-amber-400 font-bold ml-2">({progress.booksPercent}%)</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="relative h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress.booksPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>0 books</span>
                  <span>
                    {progress.booksRead >= progress.targetBooks
                      ? 'Goal achieved!'
                      : `${progress.targetBooks - progress.booksRead} book${progress.targetBooks - progress.booksRead === 1 ? '' : 's'} remaining`}
                  </span>
                  <span>{progress.targetBooks} books</span>
                </div>
              </div>
            )}

            {/* 2. Pages Progress Bar */}
            {(metricView === 'both' || metricView === 'pages') && (
              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Total Pages Read
                  </span>
                  <div className="font-mono text-sm">
                    <span className="font-bold text-stone-100">{progress.pagesRead.toLocaleString()}</span>
                    <span className="text-stone-500"> / {progress.targetPages.toLocaleString()} pages</span>
                    <span className="text-emerald-400 font-bold ml-2">({progress.pagesPercent}%)</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="relative h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress.pagesPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>0 pages</span>
                  <span>
                    {progress.pagesRead >= progress.targetPages
                      ? 'Target surpassed!'
                      : `${(progress.targetPages - progress.pagesRead).toLocaleString()} pages remaining`}
                  </span>
                  <span>{progress.targetPages.toLocaleString()} pages</span>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Intention / Theme Banner */}
          {activeGoal.intention && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 font-semibold">
                  Monthly Reading Intention
                </div>
                <p className="text-xs sm:text-sm text-stone-200 italic font-serif">
                  “{activeGoal.intention}”
                </p>
              </div>
            </div>
          )}

          {/* Goal Completed Celebration Banner */}
          {progress.isGoalMet && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Congratulations! Goal Completed
                  </div>
                  <div className="text-xs text-stone-300">
                    You have successfully fulfilled your reading targets for {progress.monthLabel}.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTriggerCelebration}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-stone-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0"
              >
                🎉 Confetti
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Pacing Intelligence & Archetype Link (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Pacing Trajectory Card */}
          <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              <Clock className="w-4 h-4" />
              Velocity & Trajectory
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                <div className="text-[11px] text-stone-500 font-medium">Daily Required Pace</div>
                <div className="text-2xl font-mono font-bold text-amber-400 mt-0.5">
                  {progress.isGoalMet
                    ? '0.0'
                    : progress.daysRemaining > 0
                    ? progress.requiredPpdForPages.toFixed(1)
                    : 'N/A'}{' '}
                  <span className="text-xs font-normal text-stone-400">PPD</span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  {progress.isGoalMet
                    ? 'Target already reached! Any extra reading is pure bonus.'
                    : progress.daysRemaining > 0
                    ? `Read ~${Math.ceil(progress.requiredPpdForPages)} pages daily across the remaining ${progress.daysRemaining} days to hit your page target.`
                    : 'Month has concluded.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                <div className="text-[11px] text-stone-500 font-medium">Archetype Velocity Tier</div>
                <div className="text-base font-bold text-stone-100 mt-0.5 flex items-center gap-2">
                  <span>{progress.projectedArchetype}</span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Your required reading rate aligns with the{' '}
                  <strong className="text-stone-300 font-normal">{progress.projectedArchetype}</strong> pace.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                <div className="text-[11px] text-stone-500 font-medium">Average PPD Logged This Month</div>
                <div className="text-xl font-mono font-bold text-stone-200 mt-0.5">
                  {progress.averagePpdAchieved.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-stone-400">PPD average</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Read in this Month */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-100">
              Completed Volumes in {progress.monthLabel} ({monthBooks.length})
            </h3>
            <p className="text-xs text-stone-400">
              Books with completion dates recorded in {progress.monthLabel}.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToTrack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors border border-stone-700"
          >
            + Log Another Read
          </button>
        </div>

        {monthBooks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-stone-900/40 border border-stone-800 space-y-3">
            <BookOpen className="w-8 h-8 text-stone-600 mx-auto" />
            <h4 className="text-base font-semibold text-stone-300">
              No books finished yet in {progress.monthLabel}
            </h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Finish a book this month and record its completion date to see it count towards your monthly goal.
            </p>
            <button
              type="button"
              onClick={onNavigateToTrack}
              className="mt-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
            >
              Track Book for {progress.monthLabel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthBooks.map((book) => {
              const arch = ARCHETYPES[book.archetypeId] || ARCHETYPES['steady-cruiser'];
              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 hover:bg-stone-900 transition-all cursor-pointer space-y-2.5 group shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-semibold text-stone-300 flex items-center gap-1">
                      {arch.badgeEmoji} {arch.shortName}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      ★ {book.rating.toFixed(1)}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-serif font-bold text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                      {book.title}
                    </h5>
                    {book.author && (
                      <p className="text-xs text-stone-400 mt-0.5">by {book.author}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>{book.totalPages} pages</span>
                    <span>{book.ppd.toFixed(1)} PPD</span>
                    <span className="text-stone-500">{book.finishDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <GoalEditModal
          goal={activeGoal}
          monthKey={selectedMonthKey}
          onSave={(updated) => {
            onUpdateGoal(updated);
            setIsEditingGoal(false);
          }}
          onClose={() => setIsEditingGoal(false)}
        />
      )}
    </div>
  );
};
