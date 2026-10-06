import { ArchetypeId, ArchetypeDefinition } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';

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
 * Assigns Reading Speed Archetype based on PPD:
 * 80+ PPD: Speed Reader / Page Turner
 * 40–79 PPD: Steady Cruiser
 * 15–39 PPD: Book Sommelier
 * < 15 PPD: Bedtime Taster
 */
export function getArchetypeByPPD(ppd: number): ArchetypeDefinition {
  if (ppd >= 80) {
    return ARCHETYPES['speed-reader'];
  }
  if (ppd >= 40) {
    return ARCHETYPES['steady-cruiser'];
  }
  if (ppd >= 15) {
    return ARCHETYPES['book-sommelier'];
  }
  return ARCHETYPES['bedtime-taster'];
}

/**
 * Rounds and formats a rating into 0.2 precision (e.g. 0.2, 0.4, ... 4.8, 5.0)
 */
export function snapToPrecision02(val: number): number {
  const clamped = Math.min(5.0, Math.max(0.2, val));
  const rounded = Math.round(clamped * 5) / 5; // Multiplies by 5, rounds, divides by 5 -> steps of 0.2
  return Math.round(rounded * 10) / 10;
}

export function formatRating(val: number): string {
  const snapped = snapToPrecision02(val);
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
