import { BookEntry, ArchetypeDefinition } from '../types/book';
import { getArchetypeByPPD } from './calculator';
import { ARCHETYPES } from '../constants/archetypes';
import { normalizeGenre } from './genreMapper';

export interface UserReadingProfile {
  totalBooks: number;
  totalPages: number;
  totalDays: number;
  overallPpd: number;
  archetype: ArchetypeDefinition;
  averageRating: number;
  topGenres: { genre: string; count: number; percent: number }[];
  summaryCaption: string;
}

export function calculateOverallProfile(books: BookEntry[]): UserReadingProfile {
  if (!books || books.length === 0) {
    const defaultArch = ARCHETYPES['steady-cruiser'];
    return {
      totalBooks: 0,
      totalPages: 0,
      totalDays: 0,
      overallPpd: 0,
      archetype: defaultArch,
      averageRating: 0,
      topGenres: [],
      summaryCaption: 'No books logged yet on PagePace.',
    };
  }

  const totalBooks = books.length;
  const totalPages = books.reduce((acc, b) => acc + (b.totalPages || 0), 0);
  const totalDays = books.reduce((acc, b) => acc + (b.elapsedDays || 1), 0);

  // Weighted overall Pages Per Day (Total Pages divided by Total Days)
  const rawPpd = totalPages / Math.max(1, totalDays);
  const overallPpd = Math.round(rawPpd * 10) / 10;
  const archetype = getArchetypeByPPD(overallPpd);

  // Average Rating (0.1 precision)
  const ratingSum = books.reduce((acc, b) => acc + (b.rating || 0), 0);
  const averageRating = Math.round((ratingSum / totalBooks) * 10) / 10;

  // Genre counts
  const genreCounts: Record<string, number> = {};
  books.forEach((b) => {
    const g = normalizeGenre(b.genre);
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({
      genre,
      count,
      percent: Math.round((count / totalBooks) * 100),
    }));

  const topGenres = sortedGenres.slice(0, 3);
  const topGenreNames = topGenres.map((g) => g.genre).join(', ') || 'Eclectic Reader';

  // Social caption
  const summaryCaption = `📚 My Reading Archetype: ${archetype.name} (${overallPpd.toFixed(1)} PPD)
✨ Tracked with PagePace

📊 Overall Reading Stats:
• Books Completed: ${totalBooks} ${totalBooks === 1 ? 'book' : 'books'}
• Total Pages Read: ${totalPages.toLocaleString()} pages
• Reading Pace: ${overallPpd.toFixed(1)} Pages/Day
• Average Rating: ★ ${averageRating.toFixed(1)} / 5.0
• Top Genres: ${topGenreNames}

“${archetype.tagline}”

#PagePace #BookPace #ReadingArchetype #BookTok #Bookstagram #ReadingTracker #BookLover`;

  return {
    totalBooks,
    totalPages,
    totalDays,
    overallPpd,
    archetype,
    averageRating,
    topGenres,
    summaryCaption,
  };
}
