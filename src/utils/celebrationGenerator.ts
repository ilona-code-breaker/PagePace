import { ArchetypeId } from '../types/book';

interface CelebrationOptions {
  title: string;
  author?: string;
  totalPages: number;
  elapsedDays: number;
  ppd: number;
  archetypeId: ArchetypeId;
  rating: number;
  review?: string;
}

export function generateArchetypeCelebration({
  title,
  author,
  totalPages,
  elapsedDays,
  ppd,
  archetypeId,
  rating,
  review,
}: CelebrationOptions): string {
  const cleanTitle = title.trim() || 'this book';
  const authorMention = author?.trim() ? ` by ${author.trim()}` : '';
  const daysText = elapsedDays === 1 ? 'just a single day' : `${elapsedDays} days`;

  // Sentiment nuances
  const isHighRating = rating >= 4.4;
  const isMidRating = rating >= 3.4 && rating < 4.4;

  switch (archetypeId) {
    case 'speed-reader': {
      if (isHighRating) {
        return `Absolute lightning in a bottle! You demolished ${totalPages} pages of "${cleanTitle}"${authorMention} in ${daysText}—clocking an astronomical ${ppd} pages per day. Giving it a stellar ${rating.toFixed(1)}/5.0 makes sense; when a plot grips you this fiercely, sleep isn't just optional, it's irrelevant. You are the definitive Page Turner force of nature!`;
      } else if (isMidRating) {
        return `Hypersonic velocity unlocked! At ${ppd} PPD over ${daysText}, you blitzed right through "${cleanTitle}" without blinking. Even with a measured ${rating.toFixed(1)}/5.0 verdict, your hunger for story momentum is formidable. Nothing stands between you and the final chapter!`;
      } else {
        return `Unstoppable momentum! You powered through all ${totalPages} pages of "${cleanTitle}" in ${daysText} (${ppd} PPD). Even if the narrative only earned a ${rating.toFixed(1)}/5.0 from you, your reading speed proved that you don't mess around when closing a book case. On to the next conquest!`;
      }
    }

    case 'steady-cruiser': {
      if (isHighRating) {
        return `Rhythmic brilliance at its finest. Navigating ${totalPages} pages of "${cleanTitle}"${authorMention} at ${ppd} pages a day across ${daysText} is a textbook masterclass in daily reading flow. Your ${rating.toFixed(1)}/5.0 rating proves that consistency and deep narrative satisfaction go hand in hand. The bookshelf bows to your discipline!`;
      } else if (isMidRating) {
        return `Smooth, unwavering execution! Logging a clean ${ppd} PPD over ${daysText} on "${cleanTitle}", you demonstrated the dependable habit that authors dream of. Awarding it a solid ${rating.toFixed(1)}/5.0, your steady cruise kept the story alive without a shred of reader fatigue.`;
      } else {
        return `Ironclad dedication! Finishing ${totalPages} pages in ${daysText} (${ppd} PPD) shows pure reading stamina. Even when a story lands at ${rating.toFixed(1)}/5.0, your Steady Cruiser engine never stalled. That's true reader grit in action!`;
      }
    }

    case 'book-sommelier': {
      if (isHighRating) {
        return `An exquisite literary vintage! Taking ${daysText} to savor "${cleanTitle}"${authorMention} at ${ppd} pages a day is exactly how magnificent prose is meant to breathe. Your glowing ${rating.toFixed(1)}/5.0 rating honors the craft—you didn't just read the story, you let every nuance, motif, and character choice steep like rare wine. Pure Sommelier depth!`;
      } else if (isMidRating) {
        return `A discerning tasting! At a thoughtful ${ppd} PPD over ${daysText}, you gave "${cleanTitle}" the breathing room and critical eye it warranted. Your thoughtful ${rating.toFixed(1)}/5.0 evaluation reflects a reader who values prose quality and thoughtful pacing over hollow speed. Respect for the craft!`;
      } else {
        return `The mark of a true critic. Lingering over "${cleanTitle}" at ${ppd} pages per day across ${daysText} allowed you to fairly weigh every chapter. Even rating it ${rating.toFixed(1)}/5.0, your patience proves you treat reading as an art form rather than a checklist sprint.`;
      }
    }

    case 'bedtime-taster': {
      if (isHighRating) {
        return `Sanctuary and tranquility perfected. Gently savoring ${ppd} pages a day across ${daysText} turns "${cleanTitle}"${authorMention} into the ultimate restorative escape. Your beloved ${rating.toFixed(1)}/5.0 rating proves that reading before sleep is sacred self-care. You gave your nervous system peace, and this book was your soft landing.`;
      } else if (isMidRating) {
        return `The golden antidote to screen time. Devoting peaceful nightcaps to "${cleanTitle}" at ${ppd} PPD over ${daysText} is pure mindful relaxation. Your cozy ${rating.toFixed(1)}/5.0 reflection captures reading as an unhurried haven. No deadlines, no pressure—just sweet, winding-down solace.`;
      } else {
        return `Mindful leisure at its purest. Drifting through "${cleanTitle}" at ${ppd} pages per day across ${daysText} honors reading as low-stress self-care. Even with a modest ${rating.toFixed(1)}/5.0 rating, the ritual of unhurried nighttime reading remains an unbeatable victory for your well-being.`;
      }
    }
  }
}
