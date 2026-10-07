import React from 'react';
import { ArchetypeId, ArchetypeDefinition } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { getArchetypeByPPD } from '../utils/calculator';
import {
  Flame,
  Zap,
  Rocket,
  Compass,
  Armchair,
  Wine,
  Moon,
  Gauge,
} from 'lucide-react';

interface VelocityTelemetryBarProps {
  ppd: number;
  elapsedDays?: number;
  totalPages?: number;
  variant?: 'full' | 'compact' | 'modal';
  showSegments?: boolean;
}

const TIER_ORDER: ArchetypeId[] = [
  'bedtime-taster',
  'book-sommelier',
  'cozy-lounge-reader',
  'steady-cruiser',
  'momentum-builder',
  'speed-reader',
  'narrative-comet',
];

export const VelocityTelemetryBar: React.FC<VelocityTelemetryBarProps> = ({
  ppd,
  elapsedDays,
  totalPages,
  variant = 'full',
  showSegments = true,
}) => {
  const currentArchetype: ArchetypeDefinition = getArchetypeByPPD(ppd);

  const getTierIcon = (id: ArchetypeId, className = 'w-4 h-4') => {
    switch (id) {
      case 'narrative-comet':
        return <Flame className={`${className} text-rose-400`} />;
      case 'speed-reader':
        return <Zap className={`${className} text-amber-400`} />;
      case 'momentum-builder':
        return <Rocket className={`${className} text-emerald-400`} />;
      case 'steady-cruiser':
        return <Compass className={`${className} text-cyan-400`} />;
      case 'cozy-lounge-reader':
        return <Armchair className={`${className} text-blue-400`} />;
      case 'book-sommelier':
        return <Wine className={`${className} text-pink-400`} />;
      case 'bedtime-taster':
        return <Moon className={`${className} text-violet-400`} />;
    }
  };

  // Calculate percentage within standard display range [0 - 140 PPD]
  const clampPpd = Math.max(0, Math.min(140, ppd));
  const pinPercent = Math.min(98, Math.max(2, (clampPpd / 140) * 100));

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800/90 space-y-3.5 shadow-inner">
      {/* Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-md shrink-0 transition-all duration-300"
            style={{
              backgroundColor: `${currentArchetype.accentHex}18`,
              borderColor: `${currentArchetype.accentHex}40`,
              borderWidth: 1,
            }}
          >
            {currentArchetype.badgeEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Live Archetype Telemetry (7 Tiers)
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold"
                style={{
                  color: currentArchetype.accentHex,
                  backgroundColor: `${currentArchetype.accentHex}15`,
                  border: `1px solid ${currentArchetype.accentHex}30`,
                }}
              >
                {currentArchetype.ppdRange}
              </span>
            </div>
            <div className="text-base font-serif font-bold text-stone-100 flex items-center gap-2 mt-0.5">
              <span>{currentArchetype.name}</span>
            </div>
          </div>
        </div>

        {/* Velocity Stats */}
        <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto">
          {typeof elapsedDays === 'number' && (
            <div>
              <div className="text-[10px] text-stone-500 font-medium">Duration</div>
              <div className="text-sm font-bold text-stone-200">
                {elapsedDays} <span className="text-stone-500 text-xs font-normal">{elapsedDays === 1 ? 'day' : 'days'}</span>
              </div>
            </div>
          )}
          {typeof totalPages === 'number' && (
            <div>
              <div className="text-[10px] text-stone-500 font-medium">Pages</div>
              <div className="text-sm font-bold text-stone-200">
                {totalPages.toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <div className="text-[10px] text-stone-500 font-medium">Velocity</div>
            <div
              className="text-lg font-bold font-mono transition-colors"
              style={{ color: currentArchetype.accentHex }}
            >
              {ppd.toFixed(1)}{' '}
              <span className="text-xs font-normal text-stone-400">PPD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="text-xs text-stone-300 italic font-serif leading-relaxed">
        “{currentArchetype.tagline}”
      </div>

      {/* 7-Tier Segmented Velocity Visual Bar */}
      {showSegments && (
        <div className="space-y-1.5 pt-1">
          <div className="relative">
            {/* The 7 Segments Bar */}
            <div className="grid grid-cols-7 gap-1 h-3 rounded-full overflow-hidden bg-stone-900 p-0.5 border border-stone-800">
              {TIER_ORDER.map((tierId) => {
                const tier = ARCHETYPES[tierId];
                const isActive = currentArchetype.id === tierId;
                return (
                  <div
                    key={tierId}
                    title={`${tier.name} (${tier.ppdRange})`}
                    className={`h-full rounded-sm transition-all duration-300 relative ${
                      isActive
                        ? 'opacity-100 ring-2 ring-white/70 shadow-lg scale-y-110 z-10'
                        : 'opacity-40 hover:opacity-75'
                    }`}
                    style={{
                      backgroundColor: tier.accentHex,
                    }}
                  />
                );
              })}
            </div>

            {/* Position Pin Indicator */}
            <div
              className="absolute -top-1.5 -translate-x-1/2 transition-all duration-300 pointer-events-none"
              style={{ left: `${pinPercent}%` }}
            >
              <div
                className="w-3 h-3 rounded-full shadow-md border-2 border-stone-950"
                style={{
                  backgroundColor: currentArchetype.accentHex,
                  boxShadow: `0 0 0 1px ${currentArchetype.accentHex}`,
                }}
              />
            </div>
          </div>

          {/* 7 Tier Threshold Markers & Emojis */}
          <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-stone-400 text-center pt-0.5">
            {TIER_ORDER.map((tierId) => {
              const tier = ARCHETYPES[tierId];
              const isActive = currentArchetype.id === tierId;
              return (
                <div
                  key={tierId}
                  className={`flex flex-col items-center transition-colors truncate px-0.5 ${
                    isActive ? 'font-bold scale-105' : 'opacity-60'
                  }`}
                  style={{ color: isActive ? tier.accentHex : undefined }}
                  title={`${tier.name} (${tier.ppdRange})`}
                >
                  <span className="text-[11px] leading-tight">{tier.badgeEmoji}</span>
                  <span className="hidden sm:inline truncate max-w-full">{tier.name.split(' ')[0]}</span>
                  <span className="text-[8px] text-stone-500 font-mono">
                    {tier.minPpd === 0.1 ? '0' : tier.minPpd}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
