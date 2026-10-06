import React from 'react';
import { BookOpen, Volume2, VolumeX, Sparkles, Plus, Compass, Target } from 'lucide-react';

interface NavbarProps {
  currentTab: 'track' | 'library' | 'goals' | 'codex';
  onTabChange: (tab: 'track' | 'library' | 'goals' | 'codex') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  libraryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  soundEnabled,
  onToggleSound,
  libraryCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-[#0f1117]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onTabChange('track')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-stone-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-xl tracking-tight text-stone-100 group-hover:text-amber-300 transition-colors">
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

        {/* Navigation Tabs (Functional buttons per Frontend Design Constitution) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange('track')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              currentTab === 'track'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Track</span> Book
          </button>

          <button
            type="button"
            onClick={() => onTabChange('goals')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              currentTab === 'goals'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span>Goals</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('library')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              currentTab === 'library'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Library</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
              {libraryCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('codex')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              currentTab === 'codex'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Codex</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors ml-1"
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
