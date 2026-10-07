import React, { useState } from 'react';
import { ARCHETYPES } from '../constants/archetypes';
import { ArchetypeId } from '../types/book';
import {
  Zap,
  Compass,
  Wine,
  Moon,
  Calculator,
  Flame,
  Rocket,
  Armchair,
  Heart,
  Sparkles,
} from 'lucide-react';

export const ArchetypeCodex: React.FC = () => {
  const [testPages, setTestPages] = useState<number>(400);

  const archetypeList = Object.values(ARCHETYPES);

  const getArchetypeIcon = (id: ArchetypeId) => {
    switch (id) {
      case 'narrative-comet':
        return <Flame className="w-6 h-6 text-rose-400" />;
      case 'speed-reader':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'momentum-builder':
        return <Rocket className="w-6 h-6 text-emerald-400" />;
      case 'steady-cruiser':
        return <Compass className="w-6 h-6 text-cyan-400" />;
      case 'cozy-lounge-reader':
        return <Armchair className="w-6 h-6 text-blue-400" />;
      case 'book-sommelier':
        return <Wine className="w-6 h-6 text-pink-400" />;
      case 'bedtime-taster':
        return <Moon className="w-6 h-6 text-violet-400" />;
    }
  };

  // Calculate days needed for target book across all 7 tiers
  const calcTargetDays = (pages: number) => {
    // 125.0+ PPD: Narrative Comet
    const cometDaysMax = Math.max(1, Math.floor(pages / 125));

    // 90.0–124.9 PPD: Speed Reader
    const speedDaysMin = Math.max(cometDaysMax + 1, Math.ceil(pages / 124.99));
    const speedDaysMax = Math.max(speedDaysMin, Math.floor(pages / 90));

    // 65.0–89.9 PPD: Momentum Builder
    const momentumDaysMin = Math.max(speedDaysMax + 1, Math.ceil(pages / 89.99));
    const momentumDaysMax = Math.max(momentumDaysMin, Math.floor(pages / 65));

    // 45.0–64.9 PPD: Steady Cruiser
    const cruiseDaysMin = Math.max(momentumDaysMax + 1, Math.ceil(pages / 64.99));
    const cruiseDaysMax = Math.max(cruiseDaysMin, Math.floor(pages / 45));

    // 30.0–44.9 PPD: Cozy Lounge Reader
    const loungeDaysMin = Math.max(cruiseDaysMax + 1, Math.ceil(pages / 44.99));
    const loungeDaysMax = Math.max(loungeDaysMin, Math.floor(pages / 30));

    // 15.0–29.9 PPD: Book Sommelier
    const sommelierDaysMin = Math.max(loungeDaysMax + 1, Math.ceil(pages / 29.99));
    const sommelierDaysMax = Math.max(sommelierDaysMin, Math.floor(pages / 15));

    // 0.1–14.9 PPD: Bedtime Taster
    const tasterDaysMin = Math.max(sommelierDaysMax + 1, Math.ceil(pages / 14.99));

    return {
      cometDaysMax,
      speedDaysMin,
      speedDaysMax,
      momentumDaysMin,
      momentumDaysMax,
      cruiseDaysMin,
      cruiseDaysMax,
      loungeDaysMin,
      loungeDaysMax,
      sommelierDaysMin,
      sommelierDaysMax,
      tasterDaysMin,
    };
  };

  const targets = calcTargetDays(testPages);

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Intro Philosophy Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
          <Heart className="w-4 h-4 text-rose-400" />
          The PagePace Philosophy
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
          7 Reading Speed Archetypes • Every Pace is a Superpower
        </h2>
        <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
          Traditional book trackers obsess over raw page volume and arbitrary yearly quotas.
          PagePace reframes reading velocity into reader identity. We never shame slower readers—we celebrate
          Bedtime Tasters for restorative self-care and Book Sommeliers for deep literary aeration,
          honor Lounge Readers and Steady Cruisers for habit mastery, and applaud Momentum Builders,
          Speed Readers, and Narrative Comets for thrilling plotline velocity.
        </p>
      </div>

      {/* 7 Archetypes Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archetypeList.map((arch) => (
          <div
            key={arch.id}
            className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 shadow-sm">
                    {getArchetypeIcon(arch.id)}
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-100">{arch.name}</h3>
                    <span className="text-xs font-mono font-semibold" style={{ color: arch.accentHex }}>
                      {arch.ppdRange}
                    </span>
                  </div>
                </div>
                <span className="text-2xl">{arch.badgeEmoji}</span>
              </div>

              <p className="text-xs font-serif italic text-stone-300">
                “{arch.tagline}”
              </p>

              <p className="text-xs text-stone-400 leading-relaxed">
                {arch.description}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800/80 space-y-2">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                Reading Philosophy:
              </div>
              <p className="text-[11px] text-stone-300 italic leading-snug">
                {arch.celebrationPhilosophy}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {arch.strengths.map((str) => (
                  <span
                    key={str}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-stone-300 font-mono"
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
              Interactive Pace Simulator (7 Tiers)
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

        {/* Breakdown across all 7 tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {/* Tier 7: Narrative Comet */}
          <div className="p-4 rounded-xl bg-stone-950 border border-rose-500/30 space-y-1.5">
            <div className="text-xs font-mono text-rose-400 font-semibold flex items-center gap-1">
              <span>💥 Narrative Comet</span>
              <span className="text-[10px] text-stone-500">(125+ PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              1 to {targets.cometDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Blaze through in ≤ {targets.cometDaysMax} day{targets.cometDaysMax === 1 ? '' : 's'}
            </div>
          </div>

          {/* Tier 6: Speed Reader */}
          <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 space-y-1.5">
            <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1">
              <span>⚡ Speed Reader</span>
              <span className="text-[10px] text-stone-500">(90–124 PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.speedDaysMin} to {targets.speedDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Hypersonic narrative devourer
            </div>
          </div>

          {/* Tier 5: Momentum Builder */}
          <div className="p-4 rounded-xl bg-stone-950 border border-emerald-500/30 space-y-1.5">
            <div className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <span>🚀 Momentum Builder</span>
              <span className="text-[10px] text-stone-500">(65–89 PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.momentumDaysMin} to {targets.momentumDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Accelerates as plot heats up
            </div>
          </div>

          {/* Tier 4: Steady Cruiser */}
          <div className="p-4 rounded-xl bg-stone-950 border border-cyan-500/30 space-y-1.5">
            <div className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1">
              <span>🧭 Steady Cruiser</span>
              <span className="text-[10px] text-stone-500">(45–64 PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.cruiseDaysMin} to {targets.cruiseDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Smooth, reliable daily cadence
            </div>
          </div>

          {/* Tier 3: Cozy Lounge Reader */}
          <div className="p-4 rounded-xl bg-stone-950 border border-blue-500/30 space-y-1.5">
            <div className="text-xs font-mono text-blue-400 font-semibold flex items-center gap-1">
              <span>🛋️ Cozy Lounge Reader</span>
              <span className="text-[10px] text-stone-500">(30–44 PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.loungeDaysMin} to {targets.loungeDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Settled in for effortless immersion
            </div>
          </div>

          {/* Tier 2: Book Sommelier */}
          <div className="p-4 rounded-xl bg-stone-950 border border-pink-500/30 space-y-1.5">
            <div className="text-xs font-mono text-pink-400 font-semibold flex items-center gap-1">
              <span>🍷 Book Sommelier</span>
              <span className="text-[10px] text-stone-500">(15–29 PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.sommelierDaysMin} to {targets.sommelierDaysMax} days
            </div>
            <div className="text-[11px] text-stone-400">
              Savoring every word and plot nuance
            </div>
          </div>

          {/* Tier 1: Bedtime Taster */}
          <div className="p-4 rounded-xl bg-stone-950 border border-violet-500/30 space-y-1.5 sm:col-span-2 lg:col-span-2">
            <div className="text-xs font-mono text-violet-400 font-semibold flex items-center gap-1">
              <span>🌙 Bedtime Taster</span>
              <span className="text-[10px] text-stone-500">(0.1–14.9 PPD)</span>
            </div>
            <div className="text-xl font-mono font-bold text-stone-100">
              {targets.tasterDaysMin}+ days
            </div>
            <div className="text-[11px] text-stone-400">
              Gentle, unhurried unwinding before sleep (zero pressure)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
