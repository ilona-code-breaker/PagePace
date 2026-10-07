import { BookEntry, MonthlyGoal } from '../types/book';

export interface PagePaceExportPayload {
  appName: string;
  version: string;
  exportDate: string;
  books: BookEntry[];
  goals: Record<string, MonthlyGoal>;
}

export function exportPagePaceData(
  books: BookEntry[],
  goals: Record<string, MonthlyGoal>
): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const payload: PagePaceExportPayload = {
    appName: 'PagePace',
    version: '1.0',
    exportDate: new Date().toISOString(),
    books,
    goals,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `pagepace_data_${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: {
    books: BookEntry[];
    goals: Record<string, MonthlyGoal>;
  };
}

export function validateAndParseImport(jsonContent: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonContent);

    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        error: 'Invalid file format. The file does not contain valid JSON data.',
      };
    }

    let booksArray: any[] = [];
    let goalsObj: Record<string, MonthlyGoal> = {};

    // Support both full PagePace backup { books: [...], goals: {...} } and direct array of books [...]
    if (Array.isArray(parsed)) {
      booksArray = parsed;
    } else if (Array.isArray(parsed.books)) {
      booksArray = parsed.books;
      if (parsed.goals && typeof parsed.goals === 'object') {
        goalsObj = parsed.goals;
      }
    } else {
      return {
        valid: false,
        error: 'Unrecognized structure. The backup file must contain a "books" list or an array of books.',
      };
    }

    // Validate books schema
    if (booksArray.length === 0) {
      return {
        valid: false,
        error: 'The imported file contains no books.',
      };
    }

    const validatedBooks: BookEntry[] = [];
    for (let i = 0; i < booksArray.length; i++) {
      const b = booksArray[i];
      if (!b || typeof b !== 'object') {
        return {
          valid: false,
          error: `Entry at index ${i} is not a valid book record.`,
        };
      }

      if (!b.title || typeof b.title !== 'string') {
        return {
          valid: false,
          error: `Book entry at index ${i} is missing a title.`,
        };
      }

      const totalPages = Number(b.totalPages);
      if (isNaN(totalPages) || totalPages <= 0) {
        return {
          valid: false,
          error: `Book "${b.title}" has an invalid total pages value.`,
        };
      }

      // Safe normalization
      validatedBooks.push({
        id: b.id || `imported-${Date.now()}-${i}`,
        title: b.title.trim(),
        author: b.author ? String(b.author).trim() : 'Unknown Author',
        totalPages,
        startDate: b.startDate || new Date().toISOString().split('T')[0],
        finishDate: b.finishDate || new Date().toISOString().split('T')[0],
        elapsedDays: Number(b.elapsedDays) || 1,
        ppd: Number(b.ppd) || (totalPages / Math.max(1, Number(b.elapsedDays) || 1)),
        archetypeId: b.archetypeId || 'steady-cruiser',
        rating: Number(b.rating) || 4.0,
        review: b.review || '',
        genre: b.genre || 'Fiction',
        format: b.format || 'Physical',
        coverUrl: b.coverUrl,
        isbn: b.isbn,
        publisher: b.publisher,
        publishedYear: b.publishedYear,
        celebrationMessage: b.celebrationMessage,
        createdAt: Number(b.createdAt) || Date.now(),
      });
    }

    return {
      valid: true,
      data: {
        books: validatedBooks,
        goals: goalsObj,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Corrupted file or JSON syntax error: ${err.message || 'Unable to parse JSON'}`,
    };
  }
}
