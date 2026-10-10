import React, { useState, useEffect, useRef } from 'react';
import { Tag, Check, ChevronDown } from 'lucide-react';
import { MacroGenre, MACRO_GENRES, GENRE_METADATA } from '../utils/genreMapper';

export interface GenreBadgeProps {
  currentGenre: MacroGenre | string;
  onGenreChange: (newGenre: MacroGenre) => void;
  className?: string;
  disabled?: boolean;
}

export const GenreBadge: React.FC<GenreBadgeProps> = ({
  currentGenre,
  onGenreChange,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Safe fallback to metadata if custom or unmapped string is passed
  const meta = GENRE_METADATA[currentGenre as MacroGenre] || {
    genre: 'Literary & Contemporary Fiction',
    color: '#3b82f6',
    emoji: '🏷️',
    description: 'General reading category',
  };

  const handleSelect = (genre: MacroGenre, e: React.MouseEvent) => {
    e.stopPropagation();
    if (genre !== currentGenre) {
      onGenreChange(genre);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Sleek Pill Badge Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all shadow-sm active:scale-95 ${
          isOpen
            ? 'ring-2 ring-amber-400/80 bg-stone-900 border-stone-700 text-stone-100'
            : 'bg-stone-950/80 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-stone-100'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          borderLeftColor: meta.color,
          borderLeftWidth: '3px',
        }}
        title="Click to reassign genre"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Tag className="w-3 h-3 text-stone-400 group-hover:text-amber-400 transition-colors shrink-0" />
        <span className="text-[11px] shrink-0">{meta.emoji}</span>
        <span className="truncate max-w-[170px] sm:max-w-[210px]">{currentGenre}</span>
        <ChevronDown
          className={`w-3 h-3 text-stone-500 group-hover:text-stone-300 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown of all 9 Macro-Genres */}
      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-64 sm:w-72 rounded-2xl bg-stone-950/95 border border-stone-800 shadow-2xl backdrop-blur-md p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-stone-800/80 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400">
            <span>Reassign Genre</span>
            <span className="text-amber-400 font-semibold">9 Pillars</span>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
            {MACRO_GENRES.map((genre) => {
              const isSelected = genre === currentGenre;
              const gMeta = GENRE_METADATA[genre];

              return (
                <button
                  key={genre}
                  type="button"
                  onClick={(e) => handleSelect(genre, e)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-mono transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-300 font-semibold ring-1 ring-amber-500/30'
                      : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900/90'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: gMeta.color }}
                    />
                    <span className="text-xs shrink-0">{gMeta.emoji}</span>
                    <span className="truncate font-sans text-xs">{genre}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
