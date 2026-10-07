import { ArchetypeId, ArchetypeDefinition, ReadingArchetype } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';

export type { ReadingArchetype, ArchetypeDefinition, ArchetypeId };

/**
 * Calculates elapsed days: Finish Date - Start Date + 1 (minimum 1 day).
 * Handles string formats YYYY-MM-DD cleanly in local calendar days.
 */
export function calculateElapsedDays(startDateStr: string, finishDateStr: string): number {
  if (!startDateStr || !finishDateStr) return 1;

  // Split into components to avoid timezone shifting
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [fy, fm, fd] = finishDateStr.split('-').map(Number);

  if (!sy || !sm || !sd || !fy || !fm || !fd) return 1;

  const startUtc = Date.UTC(sy, sm - 1, sd);
  const finishUtc = Date.UTC(fy, fm - 1, fd);

  const diffMs = finishUtc - startUtc;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Finish Date - Start Date + 1 (minimum 1 day)
  const elapsed = diffDays + 1;
  return Math.max(1, elapsed);
}

/**
 * Calculates Pages Per Day (PPD) = Total Pages / Elapsed Days.
 * Returns value rounded to 1 decimal place.
 */
export function calculatePPD(totalPages: number, elapsedDays: number): number {
  const safePages = Math.max(1, totalPages || 0);
  const safeDays = Math.max(1, elapsedDays || 1);
  const rawPpd = safePages / safeDays;
  return Math.round(rawPpd * 10) / 10;
}

/**
 * Assigns Reading Speed Archetype based on PPD (7 Tiers):
 * >= 125.0 PPD: 💥 Narrative Comet (Rose #f43f5e)
 * 90.0 – 124.9 PPD: ⚡ Speed Reader (Amber #f59e0b)
 * 65.0 – 89.9 PPD: 🚀 Momentum Builder (Emerald #10b981)
 * 45.0 – 64.9 PPD: 🧭 Steady Cruiser (Cyan #06b6d4)
 * 30.0 – 44.9 PPD: 🛋️ Cozy Lounge Reader (Blue #3b82f6)
 * 15.0 – 29.9 PPD: 🍷 Book Sommelier (Pink #ec4899)
 * 0.1 – 14.9 PPD: 🌙 Bedtime Taster (Violet #8b5cf6)
 */
export function getArchetypeByPPD(ppd: number): ArchetypeDefinition {
  if (ppd >= 125.0) {
    return ARCHETYPES['narrative-comet'];
  }
  if (ppd >= 90.0) {
    return ARCHETYPES['speed-reader'];
  }
  if (ppd >= 65.0) {
    return ARCHETYPES['momentum-builder'];
  }
  if (ppd >= 45.0) {
    return ARCHETYPES['steady-cruiser'];
  }
  if (ppd >= 30.0) {
    return ARCHETYPES['cozy-lounge-reader'];
  }
  if (ppd >= 15.0) {
    return ARCHETYPES['book-sommelier'];
  }
  return ARCHETYPES['bedtime-taster'];
}

// Alias per prompt specifications
export const assignArchetype = getArchetypeByPPD;

/**
 * Rounds and formats a rating into 0.1 precision (e.g. 0.1, 0.2, ... 4.9, 5.0)
 */
export function snapToPrecision01(val: number): number {
  const clamped = Math.min(5.0, Math.max(0.1, val));
  return Math.round(clamped * 10) / 10;
}

// Alias for backwards compatibility
export const snapToPrecision02 = snapToPrecision01;

export function formatRating(val: number): string {
  const snapped = snapToPrecision01(val);
  return snapped.toFixed(1);
}

export function getRatingDescriptor(rating: number): string {
  if (rating >= 4.8) return 'All-Time Masterpiece';
  if (rating >= 4.4) return 'Exceptional & Deeply Impactful';
  if (rating >= 4.0) return 'Highly Recommended Read';
  if (rating >= 3.6) return 'Thoroughly Solid & Engaging';
  if (rating >= 3.0) return 'Decent Read with Memorable Moments';
  if (rating >= 2.4) return 'Mixed Bag / Had Untapped Potential';
  if (rating >= 1.6) return 'Struggled to Connect';
  return 'Not for Me';
}
