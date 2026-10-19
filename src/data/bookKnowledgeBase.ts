export interface KnownBook {
  title: string;
  author: string;
  totalPages: number;
  genre: string;
  keywords: string[];
}

export const BOOK_KNOWLEDGE_BASE: KnownBook[] = [
  // Blockbuster & BookTok Fantasy / Romance
  {
    title: 'Fourth Wing',
    author: 'Rebecca Yarros',
    totalPages: 512,
    genre: 'Fantasy',
    keywords: ['fourth wing', 'basgiath', 'violet sorrengail', 'xaden riorson'],
  },
  {
    title: 'Iron Flame',
    author: 'Rebecca Yarros',
    totalPages: 640,
    genre: 'Fantasy',
    keywords: ['iron flame', 'fourth wing 2'],
  },
  {
    title: 'A Court of Thorns and Roses',
    author: 'Sarah J. Maas',
    totalPages: 432,
    genre: 'Fantasy',
    keywords: ['acotar', 'a court of thorns and roses', 'feyre', 'rhysand'],
  },
  {
    title: 'A Court of Mist and Fury',
    author: 'Sarah J. Maas',
    totalPages: 626,
    genre: 'Fantasy',
    keywords: ['acomaf', 'a court of mist and fury'],
  },
  {
    title: 'A Court of Wings and Ruin',
    author: 'Sarah J. Maas',
    totalPages: 720,
    genre: 'Fantasy',
    keywords: ['acowar', 'a court of wings and ruin'],
  },
  {
    title: 'Throne of Glass',
    author: 'Sarah J. Maas',
    totalPages: 416,
    genre: 'Fantasy',
    keywords: ['throne of glass', 'celaena sardothien'],
  },
  {
    title: 'Crescent City: House of Earth and Blood',
    author: 'Sarah J. Maas',
    totalPages: 816,
    genre: 'Fantasy',
    keywords: ['crescent city', 'house of earth and blood', 'bryce quinlan'],
  },

  // Sci-Fi
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    totalPages: 496,
    genre: 'Sci-Fi',
    keywords: ['project hail mary', 'andy weir', 'ryland grace', 'rocky'],
  },
  {
    title: 'The Martian',
    author: 'Andy Weir',
    totalPages: 384,
    genre: 'Sci-Fi',
    keywords: ['the martian', 'andy weir', 'mark watney'],
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    totalPages: 688,
    genre: 'Sci-Fi',
    keywords: ['dune', 'frank herbert', 'paul atreides', 'arrakis'],
  },
  {
    title: 'Dune Messiah',
    author: 'Frank Herbert',
    totalPages: 256,
    genre: 'Sci-Fi',
    keywords: ['dune messiah'],
  },
  {
    title: 'The Three-Body Problem',
    author: 'Cixin Liu',
    totalPages: 400,
    genre: 'Sci-Fi',
    keywords: ['three body problem', 'the three-body problem', 'cixin liu'],
  },
  {
    title: 'Red Rising',
    author: 'Pierce Brown',
    totalPages: 382,
    genre: 'Sci-Fi',
    keywords: ['red rising', 'darrow', 'pierce brown'],
  },
  {
    title: 'Golden Son',
    author: 'Pierce Brown',
    totalPages: 464,
    genre: 'Sci-Fi',
    keywords: ['golden son', 'red rising 2'],
  },
  {
    title: 'Morning Star',
    author: 'Pierce Brown',
    totalPages: 544,
    genre: 'Sci-Fi',
    keywords: ['morning star', 'red rising 3'],
  },

  // Literary Fiction & Modern Hits
  {
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    totalPages: 416,
    genre: 'Historical Fiction',
    keywords: ['tomorrow, and tomorrow, and tomorrow', 'tomorrow and tomorrow and tomorrow', 'sam and sadie', 'gabrielle zevin'],
  },
  {
    title: 'A Gentleman in Moscow',
    author: 'Amor Towles',
    totalPages: 462,
    genre: 'Historical Fiction',
    keywords: ['a gentleman in moscow', 'amor towles', 'count rostov'],
  },
  {
    title: 'Before the Coffee Gets Cold',
    author: 'Toshikazu Kawaguchi',
    totalPages: 224,
    genre: 'Fantasy',
    keywords: ['before the coffee gets cold', 'toshikazu kawaguchi'],
  },
  {
    title: 'Yellowface',
    author: 'R.F. Kuang',
    totalPages: 336,
    genre: 'Thriller, Mystery & Crime',
    keywords: ['yellowface', 'rf kuang', 'athena liu', 'juniper hayward'],
  },
  {
    title: 'Babel',
    author: 'R.F. Kuang',
    totalPages: 560,
    genre: 'Fantasy',
    keywords: ['babel', 'rf kuang', 'oxford silver'],
  },
  {
    title: 'The Poppy War',
    author: 'R.F. Kuang',
    totalPages: 544,
    genre: 'Fantasy',
    keywords: ['the poppy war', 'rin'],
  },
  {
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    totalPages: 400,
    genre: 'Historical Fiction',
    keywords: ['the seven husbands of evelyn hugo', 'evelyn hugo', 'taylor jenkins reid'],
  },
  {
    title: 'Daisy Jones & The Six',
    author: 'Taylor Jenkins Reid',
    totalPages: 368,
    genre: 'Historical Fiction',
    keywords: ['daisy jones & the six', 'daisy jones and the six'],
  },
  {
    title: 'Lessons in Chemistry',
    author: 'Bonnie Garmus',
    totalPages: 400,
    genre: 'Historical Fiction',
    keywords: ['lessons in chemistry', 'elizabeth zott', 'bonnie garmus'],
  },
  {
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    totalPages: 384,
    genre: 'Historical Fiction',
    keywords: ['where the crawdads sing', 'kya clark', 'delia owens'],
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    totalPages: 304,
    genre: 'Fantasy',
    keywords: ['the midnight library', 'nora seed', 'matt haig'],
  },
  {
    title: 'Normal People',
    author: 'Sally Rooney',
    totalPages: 273,
    genre: 'Romance',
    keywords: ['normal people', 'connell and marianne', 'sally rooney'],
  },
  {
    title: 'Intermezzo',
    author: 'Sally Rooney',
    totalPages: 448,
    genre: 'Romance',
    keywords: ['intermezzo', 'sally rooney'],
  },
  {
    title: 'The Song of Achilles',
    author: 'Madeline Miller',
    totalPages: 416,
    genre: 'Historical Fiction',
    keywords: ['the song of achilles', 'achilles and patroclus', 'madeline miller'],
  },
  {
    title: 'Circe',
    author: 'Madeline Miller',
    totalPages: 400,
    genre: 'Fantasy',
    keywords: ['circe', 'madeline miller'],
  },
  {
    title: 'Pachinko',
    author: 'Min Jin Lee',
    totalPages: 496,
    genre: 'Historical Fiction',
    keywords: ['pachinko', 'min jin lee', 'sunja'],
  },
  {
    title: 'Demon Copperhead',
    author: 'Barbara Kingsolver',
    totalPages: 560,
    genre: 'Historical Fiction',
    keywords: ['demon copperhead', 'barbara kingsolver'],
  },
  {
    title: 'The Secret History',
    author: 'Donna Tartt',
    totalPages: 576,
    genre: 'Thriller, Mystery & Crime',
    keywords: ['the secret history', 'donna tartt', 'richard papen'],
  },
  {
    title: 'The Goldfinch',
    author: 'Donna Tartt',
    totalPages: 784,
    genre: 'Historical Fiction',
    keywords: ['the goldfinch', 'donna tartt', 'theo decker'],
  },

  // Thriller & Mystery
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    totalPages: 336,
    genre: 'Thriller / Mystery',
    keywords: ['the silent patient', 'alicia berenson', 'alex michaelides'],
  },
  {
    title: 'The Housemaid',
    author: 'Freida McFadden',
    totalPages: 336,
    genre: 'Thriller / Mystery',
    keywords: ['the housemaid', 'millie', 'freida mcfadden'],
  },
  {
    title: "The Housemaid's Secret",
    author: 'Freida McFadden',
    totalPages: 336,
    genre: 'Thriller / Mystery',
    keywords: ["the housemaid's secret", 'the housemaids secret', 'freida mcfadden'],
  },
  {
    title: 'Verity',
    author: 'Colleen Hoover',
    totalPages: 336,
    genre: 'Thriller / Mystery',
    keywords: ['verity', 'lowen ashleigh', 'colleen hoover'],
  },
  {
    title: 'None of This Is True',
    author: 'Lisa Jewell',
    totalPages: 384,
    genre: 'Thriller / Mystery',
    keywords: ['none of this is true', 'lisa jewell'],
  },

  // Fantasy Epics
  {
    title: 'The Way of Kings',
    author: 'Brandon Sanderson',
    totalPages: 1008,
    genre: 'Fantasy',
    keywords: ['the way of kings', 'stormlight archive', 'kaladin', 'brandon sanderson'],
  },
  {
    title: 'Words of Radiance',
    author: 'Brandon Sanderson',
    totalPages: 1088,
    genre: 'Fantasy',
    keywords: ['words of radiance', 'stormlight 2'],
  },
  {
    title: 'Mistborn: The Final Empire',
    author: 'Brandon Sanderson',
    totalPages: 541,
    genre: 'Fantasy',
    keywords: ['mistborn', 'the final empire', 'vin', 'kelsier'],
  },
  {
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    totalPages: 662,
    genre: 'Fantasy',
    keywords: ['the name of the wind', 'kvothe', 'patrick rothfuss'],
  },
  {
    title: 'The Priory of the Orange Tree',
    author: 'Samantha Shannon',
    totalPages: 848,
    genre: 'Fantasy',
    keywords: ['the priory of the orange tree', 'samantha shannon'],
  },
  {
    title: 'Divine Rivals',
    author: 'Rebecca Ross',
    totalPages: 368,
    genre: 'Fantasy',
    keywords: ['divine rivals', 'iris winnow', 'roman kitt', 'rebecca ross'],
  },

  // Non-Fiction & Memoirs
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    totalPages: 320,
    genre: 'Non-Fiction',
    keywords: ['atomic habits', 'james clear'],
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    totalPages: 464,
    genre: 'Non-Fiction',
    keywords: ['sapiens', 'yuval noah harari'],
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    totalPages: 352,
    genre: 'Biography / Memoir',
    keywords: ['educated', 'tara westover'],
  },
  {
    title: "I'm Glad My Mom Died",
    author: 'Jennette McCurdy',
    totalPages: 320,
    genre: 'Biography / Memoir',
    keywords: ["i'm glad my mom died", 'im glad my mom died', 'jennette mccurdy'],
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    totalPages: 512,
    genre: 'Non-Fiction',
    keywords: ['thinking fast and slow', 'daniel kahneman'],
  },

  // Classics
  {
    title: '1984',
    author: 'George Orwell',
    totalPages: 328,
    genre: 'Classic Sci-Fi',
    keywords: ['1984', 'george orwell', 'winston smith', 'big brother'],
  },
  {
    title: 'Animal Farm',
    author: 'George Orwell',
    totalPages: 144,
    genre: 'Classic',
    keywords: ['animal farm', 'george orwell'],
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    totalPages: 180,
    genre: 'Classic',
    keywords: ['the great gatsby', 'jay gatsby', 'f scott fitzgerald'],
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    totalPages: 432,
    genre: 'Classic',
    keywords: ['pride and prejudice', 'elizabeth bennet', 'mr darcy', 'jane austen'],
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    totalPages: 336,
    genre: 'Classic',
    keywords: ['to kill a mockingbird', 'atticus finch', 'scout', 'harper lee'],
  },
  {
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    totalPages: 256,
    genre: 'Classic Sci-Fi',
    keywords: ['fahrenheit 451', 'guy montag', 'ray bradbury'],
  },
  {
    title: 'Brave New World',
    author: 'Aldous Huxley',
    totalPages: 288,
    genre: 'Classic Sci-Fi',
    keywords: ['brave new world', 'aldous huxley'],
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    totalPages: 310,
    genre: 'Fantasy',
    keywords: ['the hobbit', 'bilbo baggins', 'tolkien'],
  },
  {
    title: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien',
    totalPages: 432,
    genre: 'Fantasy',
    keywords: ['fellowship of the ring', 'the fellowship of the ring', 'lord of the rings'],
  },
  {
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    totalPages: 374,
    genre: 'Young Adult',
    keywords: ['the hunger games', 'katniss everdeen', 'suzanne collins'],
  },
  {
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    totalPages: 416,
    genre: 'Historical Fiction',
    keywords: ['tomorrow and tomorrow and tomorrow', 'gabrielle zevin', 'sam and sadie'],
  },
  {
    title: 'Daisy Jones & The Six',
    author: 'Taylor Jenkins Reid',
    totalPages: 368,
    genre: 'Historical Fiction',
    keywords: ['daisy jones', 'daisy jones and the six', 'taylor jenkins reid'],
  },
  {
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    totalPages: 400,
    genre: 'Historical Fiction',
    keywords: ['the seven husbands of evelyn hugo', 'evelyn hugo', 'monique grant'],
  },
  {
    title: 'Lessons in Chemistry',
    author: 'Bonnie Garmus',
    totalPages: 400,
    genre: 'Historical Fiction',
    keywords: ['lessons in chemistry', 'elizabeth zott', 'bonnie garmus'],
  },
  {
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    totalPages: 384,
    genre: 'Historical Fiction',
    keywords: ['where the crawdads sing', 'kya clark', 'delia owens'],
  },
  {
    title: 'Normal People',
    author: 'Sally Rooney',
    totalPages: 273,
    genre: 'Romance',
    keywords: ['normal people', 'connell and marianne', 'sally rooney'],
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    totalPages: 304,
    genre: 'Fantasy',
    keywords: ['the midnight library', 'nora seed', 'matt haig'],
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    totalPages: 336,
    genre: 'Thriller, Mystery & Crime',
    keywords: ['the silent patient', 'alicia berenson', 'alex michaelides'],
  },
  {
    title: 'Verity',
    author: 'Colleen Hoover',
    totalPages: 336,
    genre: 'Thriller, Mystery & Crime',
    keywords: ['verity', 'lowen ashleigh', 'colleen hoover'],
  },
  {
    title: 'It Ends with Us',
    author: 'Colleen Hoover',
    totalPages: 384,
    genre: 'Romance',
    keywords: ['it ends with us', 'lily bloom', 'colleen hoover'],
  },
  {
    title: 'It Starts with Us',
    author: 'Colleen Hoover',
    totalPages: 336,
    genre: 'Romance',
    keywords: ['it starts with us', 'colleen hoover', 'atlas corrigan'],
  },
  {
    title: 'Beach Read',
    author: 'Emily Henry',
    totalPages: 384,
    genre: 'Romance',
    keywords: ['beach read', 'january andrrews', 'emily henry'],
  },
  {
    title: 'Book Lovers',
    author: 'Emily Henry',
    totalPages: 400,
    genre: 'Romance',
    keywords: ['book lovers', 'nora stephens', 'emily henry'],
  },
  {
    title: 'Happy Place',
    author: 'Emily Henry',
    totalPages: 400,
    genre: 'Romance',
    keywords: ['happy place', 'harriet and wyn', 'emily henry'],
  },
  {
    title: 'The Love Hypothesis',
    author: 'Ali Hazelwood',
    totalPages: 384,
    genre: 'Romance',
    keywords: ['the love hypothesis', 'olive smith', 'adam carlsen', 'ali hazelwood'],
  },
  {
    title: 'Love on the Brain',
    author: 'Ali Hazelwood',
    totalPages: 368,
    genre: 'Romance',
    keywords: ['love on the brain', 'bee koenigswasser', 'ali hazelwood'],
  },
  {
    title: 'Love, Theoretically',
    author: 'Ali Hazelwood',
    totalPages: 400,
    genre: 'Romance',
    keywords: ['love theoretically', 'elsie hannaway', 'ali hazelwood'],
  },
  {
    title: 'Bride',
    author: 'Ali Hazelwood',
    totalPages: 416,
    genre: 'Romantasy',
    keywords: ['bride', 'misery lark', 'ali hazelwood'],
  },
  {
    title: 'Yellowface',
    author: 'R.F. Kuang',
    totalPages: 336,
    genre: 'Thriller, Mystery & Crime',
    keywords: ['yellowface', 'june hayward', 'athena liu', 'rf kuang'],
  },
  {
    title: 'Babel',
    author: 'R.F. Kuang',
    totalPages: 544,
    genre: 'Fantasy',
    keywords: ['babel', 'robin swift', 'oxford translators', 'rf kuang'],
  },
  {
    title: 'The Poppy War',
    author: 'R.F. Kuang',
    totalPages: 544,
    genre: 'Fantasy',
    keywords: ['the poppy war', 'rin', 'rf kuang'],
  },
  {
    title: 'The Song of Achilles',
    author: 'Madeline Miller',
    totalPages: 416,
    genre: 'Historical Fiction',
    keywords: ['the song of achilles', 'patroclus and achilles', 'madeline miller'],
  },
  {
    title: 'Circe',
    author: 'Madeline Miller',
    totalPages: 400,
    genre: 'Fantasy',
    keywords: ['circe', 'madeline miller'],
  },
  {
    title: 'The Housemaid',
    author: 'Freida McFadden',
    totalPages: 336,
    genre: 'Thriller, Mystery & Crime',
    keywords: ['the housemaid', 'millie calloway', 'freida mcfadden'],
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    totalPages: 352,
    genre: 'Non-Fiction, Bio & History',
    keywords: ['educated', 'tara westover', 'memoir'],
  },
  {
    title: 'Becoming',
    author: 'Michelle Obama',
    totalPages: 448,
    genre: 'Non-Fiction, Bio & History',
    keywords: ['becoming', 'michelle obama', 'memoir'],
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    totalPages: 464,
    genre: 'Non-Fiction, Bio & History',
    keywords: ['sapiens', 'yuval noah harari'],
  },
  {
    title: "I'm Glad My Mom Died",
    author: 'Jennette McCurdy',
    totalPages: 320,
    genre: 'Non-Fiction, Bio & History',
    keywords: ["i'm glad my mom died", 'jennette mccurdy'],
  },
  {
    title: 'Heartstopper: Volume 1',
    author: 'Alice Oseman',
    totalPages: 288,
    genre: 'Graphic Novels, Manga',
    keywords: ['heartstopper', 'nick and charlie', 'alice oseman'],
  },
];

/**
 * Recognizes prolific landmark authors who write predominantly in a signature macro-genre.
 * Ensures consistent assignment even when individual Goodreads rows lack explicit shelf tags.
 */
export function getAuthorLandmarkGenre(author?: string): string | null {
  if (!author || !author.trim()) return null;
  const a = author.toLowerCase().trim();

  // Romance
  if (
    a.includes('ali hazelwood') ||
    a.includes('emily henry') ||
    a.includes('colleen hoover') ||
    a.includes('nicholas sparks') ||
    a.includes('julia quinn') ||
    a.includes('christina lauren') ||
    a.includes('hannah grace') ||
    a.includes('lucy score') ||
    a.includes('ana huang')
  ) {
    return 'Romance';
  }

  // Romantasy / Fantasy
  if (
    a.includes('sarah j. maas') ||
    a.includes('sarah j maas') ||
    a.includes('rebecca yarros') ||
    a.includes('jennifer l. armentrout') ||
    a.includes('carissa broadbent')
  ) {
    return 'Romantasy';
  }

  if (
    a.includes('brandon sanderson') ||
    a.includes('george r.r. martin') ||
    a.includes('george r r martin') ||
    a.includes('j.r.r. tolkien') ||
    a.includes('tolkien') ||
    a.includes('patrick rothfuss') ||
    a.includes('robert jordan') ||
    a.includes('robin hobb') ||
    a.includes('terry pratchett')
  ) {
    return 'Fantasy';
  }

  // Sci-Fi & Dystopian
  if (
    a.includes('andy weir') ||
    a.includes('frank herbert') ||
    a.includes('isaac asimov') ||
    a.includes('philip k. dick') ||
    a.includes('william gibson') ||
    a.includes('arthur c. clarke') ||
    a.includes('cixin liu')
  ) {
    return 'Sci-Fi & Dystopian';
  }

  // Horror
  if (
    a.includes('stephen king') ||
    a.includes('shirley jackson') ||
    a.includes('clive barker') ||
    a.includes('dean koontz') ||
    a.includes('junji ito')
  ) {
    return 'Horror';
  }

  // Thriller, Mystery & Crime
  if (
    a.includes('agatha christie') ||
    a.includes('freida mcfadden') ||
    a.includes('gillian flynn') ||
    a.includes('lucy foley') ||
    a.includes('john grisham') ||
    a.includes('james patterson') ||
    a.includes('michael connelly') ||
    a.includes('harlan coben') ||
    a.includes('alex michaelides')
  ) {
    return 'Thriller, Mystery & Crime';
  }

  // Non-Fiction
  if (
    a.includes('james clear') ||
    a.includes('malcolm gladwell') ||
    a.includes('yuval noah harari') ||
    a.includes('bill bryson') ||
    a.includes('walter isaacson') ||
    a.includes('daniel kahneman') ||
    a.includes('robert greene') ||
    a.includes('tara westover') ||
    a.includes('michelle obama')
  ) {
    return 'Non-Fiction, Bio & History';
  }

  // Classics
  if (
    a.includes('jane austen') ||
    a.includes('charles dickens') ||
    a.includes('leo tolstoy') ||
    a.includes('fyodor dostoevsky') ||
    a.includes('dostoevsky') ||
    a.includes('virginia woolf') ||
    a.includes('oscar wilde') ||
    a.includes('george orwell') ||
    a.includes('f. scott fitzgerald') ||
    a.includes('mary shelley') ||
    a.includes('bram stoker') ||
    a.includes('arthur conan doyle')
  ) {
    return 'Classics';
  }

  // Graphic Novels, Manga
  if (
    a.includes('alice oseman') ||
    a.includes('eiichiro oda') ||
    a.includes('hajime isayama') ||
    a.includes('kentaro miura') ||
    a.includes('alan moore') ||
    a.includes('neil gaiman') ||
    a.includes('akira toriyama')
  ) {
    return 'Graphic Novels, Manga';
  }

  // Young Adult
  if (
    a.includes('suzanne collins') ||
    a.includes('rick riordan') ||
    a.includes('john green') ||
    a.includes('angie thomas') ||
    a.includes('rainbow rowell') ||
    a.includes('leigh bardugo')
  ) {
    return 'Young Adult';
  }

  // Historical Fiction
  if (
    a.includes('taylor jenkins reid') ||
    a.includes('hilary mantel') ||
    a.includes('ken follett') ||
    a.includes('kristin hannah') ||
    a.includes('anthony doerr') ||
    a.includes('bonnie garmus')
  ) {
    return 'Historical Fiction';
  }

  return null;
}

/**
 * Searches the internal knowledge base for matching books.
 */
export function searchKnowledgeBase(query: string): KnownBook[] {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  return BOOK_KNOWLEDGE_BASE.filter((b) => {
    if (b.title.toLowerCase().includes(clean)) return true;
    if (b.author.toLowerCase().includes(clean)) return true;
    return b.keywords.some((k) => k.includes(clean) || clean.includes(k));
  }).slice(0, 5);
}

/**
 * Normalizes title for robust fuzzy equality comparison.
 */
function normalizeTitleForMatch(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempts an exact or high-confidence match for auto-fill.
 */
export function findExactOrBestMatch(query: string, author?: string): KnownBook | null {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  const normalizedClean = normalizeTitleForMatch(clean);

  // 1. Exact title match
  const exact = BOOK_KNOWLEDGE_BASE.find(
    (b) => b.title.toLowerCase() === clean || normalizeTitleForMatch(b.title) === normalizedClean
  );
  if (exact) return exact;

  // 2. Exact keyword match
  const keywordMatch = BOOK_KNOWLEDGE_BASE.find((b) =>
    b.keywords.some((k) => k === clean || normalizeTitleForMatch(k) === normalizedClean)
  );
  if (keywordMatch) return keywordMatch;

  // 3. Starts with or contains strongly
  const startsWith = BOOK_KNOWLEDGE_BASE.find(
    (b) => {
      const bNorm = normalizeTitleForMatch(b.title);
      return bNorm.startsWith(normalizedClean) || normalizedClean.startsWith(bNorm);
    }
  );
  if (startsWith) return startsWith;

  return null;
}
