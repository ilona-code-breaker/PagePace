import React from 'react';
import { Star, Minus, Plus } from 'lucide-react';
import { snapToPrecision02, getRatingDescriptor } from '../utils/calculator';

interface RatingInputProps {
  value: number; // 0.2 to 5.0 in 0.2 steps
  onChange: (val: number) => void;
  label?: string;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  label = 'Rating (0.2 Precision)',
}) => {
  const safeVal = snapToPrecision02(value);

  const handleStep = (delta: number) => {
    const next = snapToPrecision02(safeVal + delta);
    onChange(next);
  };

  const presets = [3.0, 3.6, 4.0, 4.4, 4.8, 5.0];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium text-stone-300">{label}</label>
        <span className="font-mono text-base font-semibold text-amber-400">
          {safeVal.toFixed(1)} <span className="text-stone-500 font-normal text-xs">/ 5.0</span>
        </span>
      </div>

      {/* Visual Stars & Steppers */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-stone-900/80 border border-stone-800 rounded-xl">
        <button
          type="button"
          onClick={() => handleStep(-0.2)}
          disabled={safeVal <= 0.2}
          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Decrease by 0.2"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* 5-star visual representation with fractional filling */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            // Calculate fill percentage for this star (0 to 100%)
            const fillPct = Math.max(0, Math.min(100, (safeVal - (starIndex - 1)) * 100));

            return (
              <div
                key={starIndex}
                className="relative cursor-pointer select-none group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  // Snap to nearest 0.2 in this star's bracket
                  const rawInStar = (starIndex - 1) + ratio;
                  onChange(snapToPrecision02(rawInStar));
                }}
                title={`Click star ${starIndex} to set rating`}
              >
                {/* Background empty star */}
                <Star className="w-6 h-6 text-stone-700 stroke-1" />

                {/* Foreground filled star with clip-path */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${fillPct}%` }}
                >
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400 stroke-1" />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleStep(0.2)}
          disabled={safeVal >= 5.0}
          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Increase by 0.2"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Descriptor badge */}
        <div className="ml-auto text-xs text-stone-400 font-medium tracking-wide">
          {getRatingDescriptor(safeVal)}
        </div>
      </div>

      {/* Slider & Presets */}
      <div className="space-y-2 pt-1">
        <input
          type="range"
          min="0.2"
          max="5.0"
          step="0.2"
          value={safeVal}
          onChange={(e) => onChange(snapToPrecision02(parseFloat(e.target.value)))}
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg appearance-none"
        />

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-stone-500 mr-1">Quick Picks:</span>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`text-xs px-2.5 py-1 rounded-md font-mono transition-colors ${
                Math.abs(safeVal - preset) < 0.05
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-stone-800/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {preset.toFixed(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
