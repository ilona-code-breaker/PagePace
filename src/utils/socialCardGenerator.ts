import { ArchetypeDefinition, BookEntry } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';

export function generateSocialCaptionSnippet(book: BookEntry, archetype: ArchetypeDefinition): string {
  const authorLine = book.author ? ` by ${book.author}` : '';
  const starsCount = Math.round(book.rating);
  const starsString = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);

  const reviewBlock = book.review?.trim()
    ? `\n💬 MY VERDICT:\n“${book.review.trim()}”\n`
    : '';

  const archetypeHashtag = archetype.id.replace(/-/g, '');

  return `📖 JUST FINISHED: 《${book.title}》${authorLine}

${archetype.badgeEmoji} READING ARCHETYPE: ${archetype.name.toUpperCase()}
“${archetype.tagline}”

📊 THE PACE BREAKDOWN:
• Pages: ${book.totalPages} pages
• Duration: ${book.elapsedDays} ${book.elapsedDays === 1 ? 'day' : 'days'}
• Reading Speed: ${book.ppd.toFixed(1)} PPD (Pages Per Day)
• Score: ${book.rating.toFixed(1)} / 5.0 ${starsString}
${reviewBlock}
✨ Tracked via @PagePace • What reading archetype are you currently? 👇

#BookTok #Bookstagram #PagePace #ReadingSpeed #${archetypeHashtag} #CurrentlyReading #BookReview #BookLover #ReadingGoal #BookCommunity`;
}
