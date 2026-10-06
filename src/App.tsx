/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookEntry, MonthlyGoal } from './types/book';
import { INITIAL_SAMPLE_BOOKS, ARCHETYPES } from './constants/archetypes';
import { Navbar } from './components/Navbar';
import { BookForm } from './components/BookForm';
import { BookList } from './components/BookList';
import { ArchetypeCodex } from './components/ArchetypeCodex';
import { CompletionSummaryCard } from './components/CompletionSummaryCard';
import { MonthlyGoalTracker } from './components/MonthlyGoalTracker';
import { MonthlyGoalWidget } from './components/MonthlyGoalWidget';
import { getCurrentMonthKey } from './utils/goalUtils';
import {
  Sparkles,
  Zap,
  Compass,
  Wine,
  Moon,
  ArrowRight,
  BookOpen,
  Award,
} from 'lucide-react';

const STORAGE_KEY = 'pagepace_books_v1';
const SOUND_KEY = 'pagepace_sound_v1';
const GOALS_STORAGE_KEY = 'pagepace_monthly_goals_v1';

const DEFAULT_INITIAL_GOALS: Record<string, MonthlyGoal> = {
  '2026-10': {
    monthKey: '2026-10',
    targetType: 'both',
    targetBooks: 3,
    targetPages: 1000,
    intention: 'Autumn reading momentum & sci-fi exploration',
  },
  '2026-09': {
    monthKey: '2026-09',
    targetType: 'both',
    targetBooks: 3,
    targetPages: 1000,
    intention: 'Savoring literary classics and deep character journeys',
  },
};

export default function App() {
  const [books, setBooks] = useState<BookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_SAMPLE_BOOKS;
  });

  const [goals, setGoals] = useState<Record<string, MonthlyGoal>>(() => {
    try {
      const saved = localStorage.getItem(GOALS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_INITIAL_GOALS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [currentTab, setCurrentTab] = useState<'track' | 'library' | 'goals' | 'codex'>('track');
  const [selectedBook, setSelectedBook] = useState<BookEntry | null>(() => {
    // Default open first sample book on initial load so user immediately sees the completion card output!
    return INITIAL_SAMPLE_BOOKS[0] || null;
  });

  // Save books to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      // Ignore
    }
  }, [books]);

  // Save goals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch {
      // Ignore
    }
  }, [goals]);

  // Save sound setting
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, JSON.stringify(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  const handleUpdateGoal = (updatedGoal: MonthlyGoal) => {
    setGoals((prev) => ({
      ...prev,
      [updatedGoal.monthKey]: updatedGoal,
    }));
  };

  const handleBookCreated = (newBook: BookEntry) => {
    setBooks((prev) => [newBook, ...prev]);
    setSelectedBook(newBook);
    // Scroll to completion card smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBook?.id === id) {
      setSelectedBook(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-stone-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        libraryCount={books.length}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Archetype Quick Tier Bar */}
        <section aria-label="Reading Archetypes Overview" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          <div
            onClick={() => setCurrentTab('codex')}
            className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/40 transition-colors cursor-pointer group flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">80+ PPD</div>
              <div className="text-xs font-bold text-stone-200 truncate group-hover:text-amber-300">
                Speed Reader
              </div>
            </div>
          </div>

          <div
            onClick={() => setCurrentTab('codex')}
            className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-emerald-500/40 transition-colors cursor-pointer group flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">40–79 PPD</div>
              <div className="text-xs font-bold text-stone-200 truncate group-hover:text-emerald-300">
                Steady Cruiser
              </div>
            </div>
          </div>

          <div
            onClick={() => setCurrentTab('codex')}
            className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-purple-500/40 transition-colors cursor-pointer group flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Wine className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">15–39 PPD</div>
              <div className="text-xs font-bold text-stone-200 truncate group-hover:text-purple-300">
                Book Sommelier
              </div>
            </div>
          </div>

          <div
            onClick={() => setCurrentTab('codex')}
            className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-sky-500/40 transition-colors cursor-pointer group flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <Moon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">&lt; 15 PPD</div>
              <div className="text-xs font-bold text-stone-200 truncate group-hover:text-sky-300">
                Bedtime Taster
              </div>
            </div>
          </div>
        </section>

        {/* Highlighted Completion Summary Card (When a book is active or just logged) */}
        {selectedBook && (
          <section aria-label="Book Completion Card" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span className="font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-semibold">
                <Award className="w-4 h-4" />
                Active Completion Summary
              </span>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="hover:text-stone-200 text-stone-500 transition-colors"
              >
                Dismiss Certificate
              </button>
            </div>
            <CompletionSummaryCard
              book={selectedBook}
              onClose={() => setSelectedBook(null)}
            />
          </section>
        )}

        {/* TAB 1: Track Book Form */}
        {currentTab === 'track' && (
          <div className="space-y-6">
            {/* Compact Monthly Reading Goal Progress Widget */}
            <MonthlyGoalWidget
              books={books}
              goals={goals}
              onViewGoals={() => setCurrentTab('goals')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Column */}
              <div className="lg:col-span-7 bg-stone-900/70 border border-stone-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                    Track Book Completion
                  </h1>
                  <p className="text-stone-400 text-xs sm:text-sm mt-1">
                    Enter dates and page count. PagePace calculates your exact Pages Per Day (PPD),
                    advances your monthly goal, and assigns your personalized reading archetype.
                  </p>
                </div>

                <BookForm
                  onBookCreated={handleBookCreated}
                  soundEnabled={soundEnabled}
                />
              </div>

              {/* Side Column: Sample Books & Tips */}
              <div className="lg:col-span-5 space-y-6">
                {/* Quick Archetype Preview Explainer */}
                <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-4">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    How Archetypes Are Assigned
                  </h3>
                  <div className="space-y-2.5 text-xs text-stone-400 leading-relaxed font-sans">
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="font-mono text-stone-300 font-medium">Elapsed Days Formula:</div>
                      <code className="text-amber-400 font-mono block">Finish Date - Start Date + 1</code>
                      <span className="text-[11px] text-stone-500">Same-day read counts as 1 day minimum.</span>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="font-mono text-stone-300 font-medium">Velocity Calculation:</div>
                      <code className="text-amber-400 font-mono block">PPD = Total Pages / Elapsed Days</code>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="font-mono text-stone-300 font-medium">0.2 Precision Rating Scale:</div>
                      <span className="text-stone-300">Supports fine increments (e.g. 3.2, 4.4, 4.8, 5.0) for book connoisseurs.</span>
                    </div>
                  </div>
                </div>

                {/* Sample Library Quick Showcase */}
                <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-stone-400" />
                      Explore Archetype Samples
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('library')}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      All ({books.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {books.slice(0, 4).map((b) => {
                      const arch = ARCHETYPES[b.archetypeId] || ARCHETYPES['steady-cruiser'];
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBook(b)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                            selectedBook?.id === b.id
                              ? 'bg-stone-800 border-amber-500/50 shadow-md'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-serif font-bold text-stone-200 group-hover:text-amber-300 truncate">
                              {b.title}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                              <span style={{ color: arch.accentHex }}>{arch.shortName}</span>
                              <span>·</span>
                              <span>{b.ppd.toFixed(1)} PPD</span>
                              <span>·</span>
                              <span>★ {b.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <span className="text-xs text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Monthly Reading Goals */}
        {currentTab === 'goals' && (
          <div>
            <MonthlyGoalTracker
              books={books}
              goals={goals}
              onUpdateGoal={handleUpdateGoal}
              onSelectBook={(book) => {
                setSelectedBook(book);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToTrack={() => setCurrentTab('track')}
              soundEnabled={soundEnabled}
            />
          </div>
        )}

        {/* TAB 3: Library & Archive */}
        {currentTab === 'library' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                  Your Reading Archive
                </h1>
                <p className="text-stone-400 text-xs sm:text-sm mt-1">
                  Browse all completed books, filter by reader archetype, or open any book to export its story card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('track')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition-colors self-start sm:self-auto"
              >
                + Track New Book
              </button>
            </div>

            <BookList
              books={books}
              onSelectBook={(book) => {
                setSelectedBook(book);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDeleteBook={handleDeleteBook}
              onAddBookClick={() => setCurrentTab('track')}
            />
          </div>
        )}

        {/* TAB 4: Archetype Codex & Field Guide */}
        {currentTab === 'codex' && (
          <div>
            <ArchetypeCodex />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-8 text-center text-xs text-stone-500 space-y-2">
        <p className="font-serif">
          PagePace • Gamified Book Tracking & Reading Velocity Archetypes
        </p>
        <p className="text-[11px] text-stone-600">
          Designed with love for Speed Readers, Steady Cruisers, Book Sommeliers, and Bedtime Tasters alike.
        </p>
      </footer>
    </div>
  );
}
