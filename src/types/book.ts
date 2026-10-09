export type ArchetypeId =
  | 'bedtime-taster'
  | 'book-sommelier'
  | 'cozy-lounge-reader'
  | 'steady-cruiser'
  | 'momentum-builder'
  | 'speed-reader'
  | 'narrative-comet';

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  tagline: string;
  shortName: string;
  ppdRange: string;
  minPpd: number;
  maxPpd: number;
  description: string;
  celebrationPhilosophy: string;
  themeColor: string; // Tailwind color name or hex
  accentHex: string;
  glowHex: string;
  bgGradient: string;
  badgeEmoji: string;
  iconName: string;
  strengths: string[];
}

export type ReadingArchetype = ArchetypeDefinition;

export type { MasterGenre } from '../utils/genreMapper';

export interface BookEntry {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  startDate: string; // YYYY-MM-DD
  finishDate: string; // YYYY-MM-DD
  elapsedDays: number;
  ppd: number;
  archetypeId: ArchetypeId;
  rating: number; // 0.1 precision (e.g. 0.1 to 5.0)
  review: string;
  genre?: string;
  genres?: import('../utils/genreMapper').MasterGenre[];
  format?: 'Physical' | 'E-Reader' | 'Audiobook' | 'Hybrid';
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  publisher?: string;
  celebrationMessage?: string;
  isAiEnhanced?: boolean;
  createdAt: number;
}

export interface MonthlyGoal {
  monthKey: string; // 'YYYY-MM', e.g. '2026-10'
  targetType: 'books' | 'pages' | 'both';
  targetBooks: number;
  targetPages: number;
  intention?: string;
}
