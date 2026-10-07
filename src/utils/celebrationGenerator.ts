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
    case 'narrative-comet': {
      if (isHighRating) {
        return `Cosmic literary supernova! You tore through ${totalPages} pages of "${cleanTitle}"${authorMention} in ${daysText}—clocking an astronomical ${ppd} pages per day! Scoring it an enthusiastic ${rating.toFixed(1)}/5.0 proves this wasn't just a read, but an all-consuming obsession. You blazed through plotlines like an unstoppable Narrative Comet!`;
      } else if (isMidRating) {
        return `A roaring reading blaze! At a fierce ${ppd} PPD over ${daysText}, you orbited through "${cleanTitle}" at terminal velocity. Even with a measured ${rating.toFixed(1)}/5.0 rating, your supernatural reading speed left friction in its wake. Unstoppable velocity!`;
      } else {
        return `Blistering speed! Demolishing ${totalPages} pages in ${daysText} (${ppd} PPD) demonstrates extraordinary reading stamina. Even with a ${rating.toFixed(1)}/5.0 verdict, nothing could slow down your Narrative Comet streak!`;
      }
    }

    case 'speed-reader': {
      if (isHighRating) {
        return `Absolute lightning in a bottle! You devoured ${totalPages} pages of "${cleanTitle}"${authorMention} in ${daysText}—clocking an electrifying ${ppd} pages per day. Giving it a stellar ${rating.toFixed(1)}/5.0 makes total sense; when a plot grips you this fiercely, sleep isn't just optional, it's irrelevant. Pure Speed Reader excellence!`;
      } else if (isMidRating) {
        return `Hypersonic velocity unlocked! At ${ppd} PPD over ${daysText}, you blitzed right through "${cleanTitle}" without blinking. Even with a balanced ${rating.toFixed(1)}/5.0 review, your hunger for narrative momentum is formidable.`;
      } else {
        return `Unstoppable momentum! You powered through all ${totalPages} pages of "${cleanTitle}" in ${daysText} (${ppd} PPD). Even if the book landed at ${rating.toFixed(1)}/5.0, your Speed Reader engine closed the case without hesitation!`;
      }
    }

    case 'momentum-builder': {
      if (isHighRating) {
        return `A masterclass in narrative crescendo! Blazing through ${totalPages} pages of "${cleanTitle}"${authorMention} at ${ppd} pages a day across ${daysText} shows how you accelerate when the story catches fire. Your ${rating.toFixed(1)}/5.0 rating mirrors that magnetic pull towards the climax!`;
      } else if (isMidRating) {
        return `Gaining speed with every chapter! Clocking ${ppd} PPD over ${daysText} on "${cleanTitle}", you built irresistible momentum as the narrative unfolded. Giving it a solid ${rating.toFixed(1)}/5.0 proves your instincts as a true Momentum Builder.`;
      } else {
        return `Dynamic acceleration! You powered through ${totalPages} pages in ${daysText} (${ppd} PPD). Even rating it ${rating.toFixed(1)}/5.0, your escalating pace proved that you know how to push straight to the final page!`;
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

    case 'cozy-lounge-reader': {
      if (isHighRating) {
        return `Effortless immersion achieved! Curling up with "${cleanTitle}"${authorMention} at a comforting ${ppd} pages a day over ${daysText} is the epitome of pure reader bliss. Your glowing ${rating.toFixed(1)}/5.0 verdict reflects hours well spent wrapped in an unforgettable world. A true Cozy Lounge Reader paradise!`;
      } else if (isMidRating) {
        return `Unrushed comfort and escape! At a relaxed ${ppd} PPD across ${daysText}, you carved out peaceful reading hours with "${cleanTitle}". Rating it a thoughtful ${rating.toFixed(1)}/5.0, you proved that reading is best enjoyed with zero pressure and total presence.`;
      } else {
        return `Cozy persistence! Spending ${daysText} immersed in "${cleanTitle}" (${ppd} PPD) gave this world a fair, comfortable chance. Even at ${rating.toFixed(1)}/5.0, your dedication to calm, sustained reading is deeply admirable.`;
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
