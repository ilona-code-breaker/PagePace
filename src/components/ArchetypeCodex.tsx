import React, { useState } from 'react';
import { ARCHETYPES } from '../constants/archetypes';
import { ArchetypeId } from '../types/book';
import { Zap, Compass, Wine, Moon, Calculator, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const ArchetypeCodex: React.FC = () => {
  const [testPages, setTestPages] = useState<number>(400);

  const archetypeList = Object.values(ARCHETYPES);

  const getArchetypeIcon = (id: ArchetypeId) => {
    switch (id) {
      case 'speed-reader':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'steady-cruiser':
        return <Compass className="w-6 h-6 text-emerald-400" />;
      case 'book-sommelier':
        return <Wine className="w-6 h-6 text-purple-400" />;
      case 'bedtime-taster':
        return <Moon className="w-6 h-6 text-sky-400" />;
    }
  };

  // Calculate days needed for a target book
  const calcTargetDays = (pages: number) => {
    // 80+ PPD: days <= pages / 80
    const speedDaysMax = Math.max(1, Math.floor(pages / 80));
    // 40-79 PPD: days between pages/79 and pages/40
    const cruiseDaysMin = Math.max(speedDaysMax + 1, Math.ceil(pages / 79.99));
    const cruiseDaysMax = Math.max(cruiseDaysMin, Math.floor(pages / 40));
    // 15-39 PPD: days between pages/39 and pages/15
    const sommelierDaysMin = Math.max(cruiseDaysMax + 1, Math.ceil(pages / 39.99));
    const sommelierDaysMax = Math.max(sommelierDaysMin, Math.floor(pages / 15));
    // < 15 PPD: days > pages / 15
    const tasterDaysMin = Math.max(sommelierDaysMax + 1, Math.ceil(pages / 14.99));

    return {
      speedDaysMax,
      cruiseDaysMin,
      cruiseDaysMax,
      sommelierDaysMin,
      sommelierDaysMax,
      tasterDaysMin,
    };
  };

  const targets = calcTargetDays(testPages);

  return (
    <div className="space-y-10">
      {/* Intro Philosophy Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
          <Heart className="w-4 h-4 text-rose-400" />
          The PagePace Philosophy
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
          Every Reading Speed is a Superpower
        </h2>
        <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
          Traditional book trackers obsess over raw page volume and arbitrary yearly quotas.
          PagePace reframes reading velocity into reader identity. We never shame slow readers—we celebrate
          Sommeliers for their deep textual aeration and Bedtime Tasters for restorative self-care, while applauding
          Speed Readers for momentum and Cruisers for habit mastery.
        </p>
      </div>

      {/* 4 Archetypes Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {archetypeList.map((arch) => (
          <div
            key={arch.id}
            className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-colors space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  {getArchetypeIcon(arch.id)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-100">{arch.name}</h3>
                  <span className="text-xs font-mono font-semibold" style={{ color: arch.accentHex }}>
                    {arch.ppdRange}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm font-serif italic text-stone-300">
              “{arch.tagline}”
            </p>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {arch.description}
            </p>

            <div className="pt-3 border-t border-stone-800/80 space-y-2">
              <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                Key Strengths & Vibe:
              </div>
              <div className="flex flex-wrap gap-2">
                {arch.strengths.map((str) => (
                  <span
                    key={str}
                    className="text-xs px-2.5 py-1 rounded-md bg-stone-950 border border-stone-800 text-stone-300"
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Pace Target Simulator */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900/90 border border-amber-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-1">
              <Calculator className="w-4 h-4" />
              Interactive Pace Simulator
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-100">
              What Duration Yields Which Archetype?
            </h3>
            <p className="text-xs sm:text-sm text-stone-400">
              Plan your next read or find out how many days you need for each archetype tier.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-950 p-2 rounded-xl border border-stone-800">
            <span className="text-xs text-stone-400 font-medium pl-2">Book Length:</span>
            <input
              type="number"
              min={50}
              max={2500}
              value={testPages}
              onChange={(e) => setTestPages(Math.max(10, parseInt(e.target.value, 10) || 10))}
              className="w-24 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-amber-400 font-mono font-bold text-sm text-center focus:outline-none focus:border-amber-400"
            />
            <span className="text-xs text-stone-500 pr-2">pages</span>
          </div>
        </div>

        {/* Breakdown for the entered page count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 space-y-1.5">
            <div className="text-xs font-mono text-amber-400 font-semibold">⚡ Speed Reader (80+ PPD)</div>
            <div className="text-xl font-mono font-bold text-stone-100">
              1 to {targets.speedDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Finish in ≤ {targets.speedDaysMax} day{targets.speedDaysMax === 1 ? '' : 's'} for 80+ PPD
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-950 border border-emerald-500/30 space-y-1.5">
            <div className="text-xs font-mono text-emerald-400 font-semibold">🧭 Steady Cruiser (40–79 PPD)</div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.cruiseDaysMin} to {targets.cruiseDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Consistent daily rhythm (40–79 PPD)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-950 border border-purple-500/30 space-y-1.5">
            <div className="text-xs font-mono text-purple-400 font-semibold">🍷 Book Sommelier (15–39 PPD)</div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.sommelierDaysMin} to {targets.sommelierDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Leisurely literary tasting (15–39 PPD)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-950 border border-sky-500/30 space-y-1.5">
            <div className="text-xs font-mono text-sky-400 font-semibold">🌙 Bedtime Taster (&lt; 15 PPD)</div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.tasterDaysMin}+ days
            </div>
            <div className="text-[11px] text-stone-400">
              Unwind with cozy chapters (&lt; 15 PPD)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
