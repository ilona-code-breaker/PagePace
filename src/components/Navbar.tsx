import React from 'react';
import { BookOpen, Volume2, VolumeX, Sparkles, Plus, Compass, Target, Share2 } from 'lucide-react';

interface NavbarProps {
  currentTab: 'track' | 'library' | 'goals' | 'codex';
  onTabChange: (tab: 'track' | 'library' | 'goals' | 'codex') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  libraryCount: number;
  onOpenShareCard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  soundEnabled,
  onToggleSound,
  libraryCount,
  onOpenShareCard,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-[#0f1117]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-0">
        {/* Row 1 on mobile: Brand on left, "+ Book" on right */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          {/* Brand */}
          <div
            onClick={() => onTabChange('track')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-lg sm:text-xl tracking-tight text-stone-100 group-hover:text-amber-300 transition-colors">
                  PagePace
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">
                  Archetypes
                </span>
              </div>
              <p className="text-[10px] text-stone-400 hidden sm:block">
                Gamified Reading Velocity & Style Archetypes
              </p>
            </div>
          </div>

          {/* "+ Book" on Mobile (Row 1 right side) */}
          <div className="sm:hidden flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onTabChange('track')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm ${
                currentTab === 'track'
                  ? 'bg-amber-500 text-stone-950 shadow-amber-500/20'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-stone-950'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Book</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        {/* On mobile: row 2 underneath the "+ Book" break; on desktop: aligned inline with brand */}
        <nav className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t border-stone-800/60 sm:border-t-0">
          {/* Desktop "+ Book" button */}
          <button
            type="button"
            onClick={() => onTabChange('track')}
            className={`hidden sm:flex px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all items-center gap-1.5 ${
              currentTab === 'track'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Track Book</span>
          </button>

          {/* Goals Tab */}
          <button
            type="button"
            onClick={() => onTabChange('goals')}
            className={`flex-1 sm:flex-initial px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'goals'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Goals</span>
          </button>

          {/* Library Tab */}
          <button
            type="button"
            onClick={() => onTabChange('library')}
            className={`flex-1 sm:flex-initial px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'library'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400" />
            <span>Library</span>
            <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
              {libraryCount}
            </span>
          </button>

          {/* Codex Tab */}
          <button
            type="button"
            onClick={() => onTabChange('codex')}
            className={`flex-1 sm:flex-initial px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'codex'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400" />
            <span>Codex</span>
          </button>

          {/* Share Archetype Card Button */}
          {onOpenShareCard && (
            <button
              type="button"
              onClick={onOpenShareCard}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              title="Share your overall Reading Archetype Persona card"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Share Card</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 sm:p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors shrink-0"
            title={soundEnabled ? 'Mute celebratory sound' : 'Enable celebratory sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
