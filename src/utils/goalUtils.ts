import { BookEntry, MonthlyGoal, ArchetypeId } from '../types/book';
import { getArchetypeByPPD } from './calculator';

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getAdjacentMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;

  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getBooksForMonth(books: BookEntry[], monthKey: string): BookEntry[] {
  return books.filter((b) => b.finishDate && b.finishDate.startsWith(monthKey));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export interface MonthProgressData {
  monthKey: string;
  monthLabel: string;
  booksRead: number;
  pagesRead: number;
  targetBooks: number;
  targetPages: number;
  targetType: 'books' | 'pages' | 'both';
  intention?: string;
  booksPercent: number;
  pagesPercent: number;
  primaryPercent: number;
  isGoalMet: boolean;
  totalDaysInMonth: number;
  currentDayOfMonth: number;
  daysRemaining: number;
  isPastMonth: boolean;
  isFutureMonth: boolean;
  isCurrentMonth: boolean;
  requiredPpdForPages: number;
  averagePpdAchieved: number;
  projectedArchetype: string;
  projectedArchetypeId: ArchetypeId;
  paceStatus: 'completed' | 'ahead' | 'on_track' | 'behind' | 'past_missed';
}

export function calculateMonthProgress(
  monthKey: string,
  goal: MonthlyGoal,
  books: BookEntry[]
): MonthProgressData {
  const currentKey = getCurrentMonthKey();
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthBooks = getBooksForMonth(books, monthKey);
  const booksRead = monthBooks.length;
  const pagesRead = monthBooks.reduce((sum, b) => sum + b.totalPages, 0);

  const totalDaysInMonth = getDaysInMonth(year, month);
  const now = new Date();
  const currentDay = now.getDate();

  const isCurrentMonth = monthKey === currentKey;
  const isPastMonth = monthKey < currentKey;
  const isFutureMonth = monthKey > currentKey;

  let daysRemaining = 0;
  let daysPassed = totalDaysInMonth;

  if (isCurrentMonth) {
    daysRemaining = Math.max(0, totalDaysInMonth - currentDay);
    daysPassed = Math.max(1, currentDay);
  } else if (isPastMonth) {
    daysRemaining = 0;
    daysPassed = totalDaysInMonth;
  } else {
    // Future
    daysRemaining = totalDaysInMonth;
    daysPassed = 0;
  }

  const targetBooks = Math.max(1, goal.targetBooks || 3);
  const targetPages = Math.max(50, goal.targetPages || 1000);

  const booksPercent = Math.min(100, Math.round((booksRead / targetBooks) * 100));
  const pagesPercent = Math.min(100, Math.round((pagesRead / targetPages) * 100));

  let primaryPercent = booksPercent;
  let isGoalMet = false;

  if (goal.targetType === 'pages') {
    primaryPercent = pagesPercent;
    isGoalMet = pagesRead >= targetPages;
  } else if (goal.targetType === 'books') {
    primaryPercent = booksPercent;
    isGoalMet = booksRead >= targetBooks;
  } else {
    // Both
    primaryPercent = Math.round((booksPercent + pagesPercent) / 2);
    isGoalMet = booksRead >= targetBooks && pagesRead >= targetPages;
  }

  // Required daily pace to hit remaining pages
  const pagesNeeded = Math.max(0, targetPages - pagesRead);
  const requiredPpdForPages =
    daysRemaining > 0 ? Math.round((pagesNeeded / daysRemaining) * 10) / 10 : 0;

  // Average achieved PPD so far this month
  const averagePpdAchieved =
    daysPassed > 0 ? Math.round((pagesRead / daysPassed) * 10) / 10 : 0;

  // Archetype for required pace
  const archetypeForRequired = getArchetypeByPPD(
    requiredPpdForPages > 0 ? requiredPpdForPages : averagePpdAchieved
  );

  // Pace status determination
  let paceStatus: 'completed' | 'ahead' | 'on_track' | 'behind' | 'past_missed' = 'on_track';
  if (isGoalMet) {
    paceStatus = 'completed';
  } else if (isPastMonth) {
    paceStatus = 'past_missed';
  } else if (isFutureMonth) {
    paceStatus = 'on_track';
  } else {
    // Current month evaluation based on calendar elapsed ratio vs progress ratio
    const calendarElapsedRatio = currentDay / totalDaysInMonth;
    const progressRatio = (primaryPercent / 100);

    if (progressRatio >= calendarElapsedRatio + 0.1) {
      paceStatus = 'ahead';
    } else if (progressRatio >= calendarElapsedRatio - 0.15) {
      paceStatus = 'on_track';
    } else {
      paceStatus = 'behind';
    }
  }

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    booksRead,
    pagesRead,
    targetBooks,
    targetPages,
    targetType: goal.targetType,
    intention: goal.intention,
    booksPercent,
    pagesPercent,
    primaryPercent,
    isGoalMet,
    totalDaysInMonth,
    currentDayOfMonth: isCurrentMonth ? currentDay : totalDaysInMonth,
    daysRemaining,
    isPastMonth,
    isFutureMonth,
    isCurrentMonth,
    requiredPpdForPages,
    averagePpdAchieved,
    projectedArchetype: archetypeForRequired.name,
    projectedArchetypeId: archetypeForRequired.id,
    paceStatus,
  };
}
