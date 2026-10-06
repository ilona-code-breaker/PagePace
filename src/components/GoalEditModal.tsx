import React, { useState } from 'react';
import { MonthlyGoal } from '../types/book';
import { formatMonthLabel } from '../utils/goalUtils';
import { Target, BookOpen, Layers, Sparkles, X, Check } from 'lucide-react';

interface GoalEditModalProps {
  goal: MonthlyGoal;
  monthKey: string;
  onSave: (updatedGoal: MonthlyGoal) => void;
  onClose: () => void;
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  goal,
  monthKey,
  onSave,
  onClose,
}) => {
  const [targetType, setTargetType] = useState<'books' | 'pages' | 'both'>(goal.targetType);
  const [targetBooks, setTargetBooks] = useState<number>(goal.targetBooks || 3);
  const [targetPages, setTargetPages] = useState<number>(goal.targetPages || 1000);
  const [intention, setIntention] = useState<string>(goal.intention || '');

  const bookPresets = [1, 2, 3, 4, 5, 6, 8];
  const pagePresets = [300, 500, 800, 1000, 1200, 1500, 2000];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      monthKey,
      targetType,
      targetBooks: Math.max(1, targetBooks),
      targetPages: Math.max(10, targetPages),
      intention: intention.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              <Target className="w-4 h-4" />
              Monthly Reading Target
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-100">
              Set Goal for {formatMonthLabel(monthKey)}
            </h3>
            <p className="text-xs text-stone-400">
              Choose whether you measure your month by completed volumes, page count, or both.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Target Metric Segmented Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-300">
              Goal Measurement Focus
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
              <button
                type="button"
                onClick={() => setTargetType('books')}
                className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  targetType === 'books'
                    ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Number of Books
              </button>
              <button
                type="button"
                onClick={() => setTargetType('pages')}
                className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  targetType === 'pages'
                    ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Total Pages
              </button>
              <button
                type="button"
                onClick={() => setTargetType('both')}
                className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  targetType === 'both'
                    ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Both (Dual)
              </button>
            </div>
          </div>

          {/* Book Target Field */}
          {(targetType === 'books' || targetType === 'both') && (
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Target Finished Books
                </label>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {targetBooks} {targetBooks === 1 ? 'book' : 'books'}
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={50}
                value={targetBooks}
                onChange={(e) => setTargetBooks(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/50"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-stone-500 mr-1">Presets:</span>
                {bookPresets.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetBooks(num)}
                    className={`text-xs px-2.5 py-1 rounded-md font-mono transition-colors ${
                      targetBooks === num
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'bg-stone-850 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pages Target Field */}
          {(targetType === 'pages' || targetType === 'both') && (
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Target Pages Read
                </label>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {targetPages.toLocaleString()} pages
                </span>
              </div>
              <input
                type="number"
                min={50}
                max={20000}
                step={50}
                value={targetPages}
                onChange={(e) => setTargetPages(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/50"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-stone-500 mr-1">Presets:</span>
                {pagePresets.map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setTargetPages(pg)}
                    className={`text-xs px-2 py-1 rounded-md font-mono transition-colors ${
                      targetPages === pg
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'bg-stone-850 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Intention / Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Monthly Intention or Theme (Optional)
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g. Savoring cozy autumn fiction, 30 mins each night"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            >
              <Check className="w-4 h-4" />
              Save Monthly Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
