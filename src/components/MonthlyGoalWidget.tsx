import React from 'react';
import { BookEntry, MonthlyGoal } from '../types/book';
import { calculateMonthProgress, getCurrentMonthKey } from '../utils/goalUtils';
import { Target, BookOpen, Layers, ArrowRight, Trophy, HardDrive } from 'lucide-react';

interface MonthlyGoalWidgetProps {
  books: BookEntry[];
  goals: Record<string, MonthlyGoal>;
  onViewGoals: () => void;
}

export const MonthlyGoalWidget: React.FC<MonthlyGoalWidgetProps> = ({
  books,
  goals,
  onViewGoals,
}) => {
  const currentKey = getCurrentMonthKey();
  const activeGoal: MonthlyGoal = goals[currentKey] || {
    monthKey: currentKey,
    targetType: 'both',
    targetBooks: 3,
    targetPages: 1000,
  };

  const progress = calculateMonthProgress(currentKey, activeGoal, books);

  return (
    <div
      onClick={onViewGoals}
      className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
          {progress.isGoalMet ? (
            <Trophy className="w-5 h-5 text-emerald-400" />
          ) : (
            <Target className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
              {progress.monthLabel} Reading Goal
            </span>
            <span className="text-[10px] font-mono text-stone-400 bg-stone-950 px-1.5 py-0.2 rounded border border-stone-800">
              On Device
            </span>
            {progress.isGoalMet && (
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                Goal Met 🏆
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-300 mt-1 font-mono">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-stone-500" />
              <strong>{progress.booksRead}</strong> / {progress.targetBooks} books
              <span className="text-amber-400 font-semibold">({progress.booksPercent}%)</span>
            </span>
            <span className="text-stone-700">·</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <strong>{progress.pagesRead.toLocaleString()}</strong> / {progress.targetPages.toLocaleString()} pages
              <span className="text-emerald-400 font-semibold">({progress.pagesPercent}%)</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        {/* Compact Progress Bar */}
        <div className="w-24 sm:w-32 h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progress.primaryPercent}%` }}
          />
        </div>
        <span className="text-xs text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center font-medium">
          Edit Goal <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </div>
  );
};
