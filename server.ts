import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route for querying Google Books API and Open Library API
app.post('/api/search-books', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  const clean = query.trim();
  const isIsbn = /^(97(8|9))?\d{9}(\d|X)$/i.test(clean.replace(/[-\s]/g, '')) || clean.toLowerCase().startsWith('isbn:');
  const isbnClean = clean.replace(/^(isbn:)/i, '').replace(/[-\s]/g, '');

  try {
    const googleQuery = isIsbn ? `isbn:${isbnClean}` : encodeURIComponent(clean);
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${googleQuery}&maxResults=6`;

    const openLibQuery = isIsbn ? `isbn=${encodeURIComponent(isbnClean)}` : `q=${encodeURIComponent(clean)}`;
    const openLibUrl = `https://openlibrary.org/search.json?${openLibQuery}&limit=6`;

    const [gRes, olRes] = await Promise.allSettled([
      fetch(googleUrl, { signal: AbortSignal.timeout(4000) }).then((r) => r.ok ? r.json() : null),
      fetch(openLibUrl, { signal: AbortSignal.timeout(4000) }).then((r) => r.ok ? r.json() : null),
    ]);

    const results: any[] = [];
    const seen = new Set<string>();

    if (gRes.status === 'fulfilled' && gRes.value?.items) {
      for (const item of gRes.value.items) {
        const info = item.volumeInfo || {};
        const title = info.title || 'Untitled';
        const author = Array.isArray(info.authors) ? info.authors.join(', ') : info.authors || 'Unknown Author';
        const key = `${title.toLowerCase()}::${author.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
          if (coverUrl && coverUrl.startsWith('http://')) coverUrl = coverUrl.replace('http://', 'https://');

          results.push({
            title,
            author,
            totalPages: Number(info.pageCount) || 350,
            genre: (info.categories && info.categories[0]) || 'Fiction',
            coverUrl,
            publishedYear: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4), 10) : undefined,
            publisher: info.publisher,
            source: 'Google Books API',
          });
        }
      }
    }

    if (olRes.status === 'fulfilled' && olRes.value?.docs) {
      for (const doc of olRes.value.docs) {
        const title = doc.title || 'Untitled';
        const author = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : 'Unknown Author';
        const key = `${title.toLowerCase()}::${author.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          let coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined;
          results.push({
            title,
            author,
            totalPages: Number(doc.number_of_pages_median) || Number(doc.number_of_pages) || 350,
            genre: (doc.subject && doc.subject[0]) || 'Fiction',
            coverUrl,
            publishedYear: doc.first_publish_year,
            publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : undefined,
            source: 'Open Library API',
          });
        }
      }
    }

    return res.json({ results });
  } catch (error) {
    console.error('Error in /api/search-books:', error);
    return res.json({ results: [] });
  }
});

// API route for extracting book metadata (title, author, standard page count, genre)
app.post('/api/book-lookup', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json({ found: false });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json({ found: false });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `A user provided this book title or query: "${query.trim()}".
Identify the book and return ONLY valid raw JSON with no markdown backticks, matching this exact schema:
{
  "title": "Full Official Title",
  "author": "Author Name",
  "totalPages": 512,
  "genre": "Primary Genre (e.g. Fantasy, Sci-Fi, Fiction, Romance, Thriller / Mystery, Non-Fiction, Historical Fiction, Literary Fiction)"
}
If you cannot identify a real published book, return: {"found": false}
Use standard physical paperback/hardcover edition page count.`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 150,
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 4000)
    );

    const response = (await Promise.race([aiPromise, timeoutPromise])) as any;
    const rawText = response?.text?.trim() || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed && parsed.title && parsed.author && parsed.totalPages) {
      return res.json({
        found: true,
        title: parsed.title,
        author: parsed.author,
        totalPages: Number(parsed.totalPages) || 350,
        genre: parsed.genre || 'Fiction',
      });
    }
    return res.json({ found: false });
  } catch (error) {
    console.error('Error in /api/book-lookup:', error);
    return res.json({ found: false });
  }
});

// API route for generating enhanced AI archetype celebration & literary praise
app.post('/api/archetype-celebration', async (req: Request, res: Response) => {
  const { title, author, totalPages, elapsedDays, ppd, archetype, rating, review } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Return a thoughtful fallback if API key is not configured
    return res.json({
      enhanced: false,
      message: getFallbackCelebration(archetype, ppd, rating, title, elapsedDays),
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the witty, encouraging, and warm literary engine of "PagePace".
A reader just finished a book with the following stats:
- Title: "${title || 'Untitled'}" ${author ? `by ${author}` : ''}
- Total Pages: ${totalPages}
- Reading Duration: ${elapsedDays} day(s)
- Reading Velocity: ${ppd} Pages Per Day (PPD)
- Assigned Reader Archetype: ${archetype}
- Reader Rating: ${rating} / 5.0 (0.1 precision scale)
- Reader Review / Thoughts: "${review || 'No written notes.'}"

PagePace recognizes 7 distinct Reading Speed Archetypes:
1. 🌙 Bedtime Taster (0.1–14.9 PPD): 'Gentle, low-pressure reading to unwind.' Sacred mindful self-care, stress relief, and honoring unhurried nighttime pages before sleep.
2. 🍷 Book Sommelier (15.0–29.9 PPD): 'Savoring every word, chapter, and plot nuance.' Prose aeration, deep textual absorption, literary critique, and rich intellectual subtext.
3. 🛋️ Cozy Lounge Reader (30.0–44.9 PPD): 'Settled in for the long haul; effortless immersion.' Blanket-wrapped comfort, sustained attention span, zero deadlines, and warm narrative indulgence.
4. 🧭 Steady Cruiser (45.0–64.9 PPD): 'Consistent, reliable, and smooth execution.' Clockwork daily habit, rhythmic cadence, and dependable literary stamina.
5. 🚀 Momentum Builder (65.0–89.9 PPD): 'Gaining speed as the climax approaches.' Dynamic acceleration, emotional crescendo, and irresistible pull toward the finale.
6. ⚡ Speed Reader (90.0–124.9 PPD): 'Blink and you miss it! A force of nature through plotlines.' Supersonic devourer, electric plot binge-reading, and zero cliffhanger lag.
7. 💥 Narrative Comet (125.0+ PPD): 'An unstoppable literary streak blazing through entire series.' Supernova reading stamina, cosmic story absorption, and fierce unyielding passion.

Generate a short, warm, bespoke celebration message (2-3 punchy sentences) that:
1. Validates and honors their specific assigned archetype (${archetype}) and velocity (${ppd} PPD). (CRITICAL: Every pace is a superpower! Treat Bedtime Tasters, Sommeliers, and Lounge Readers with royal literary respect for presence and craft, and applaud Momentum Builders, Speed Readers, and Comets for their electrifying speed).
2. Directly incorporates their assigned archetype philosophy and connects their ${rating}/5.0 rating and thoughts to their pace.
3. Keeps a modern, witty, encouraging BookTok/Bookstagram-friendly tone. Do not include markdown headers or bullet points; just the warm celebratory message text.`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 250,
        temperature: 0.7,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 5000)
    );

    const response = (await Promise.race([aiPromise, timeoutPromise])) as any;

    const text = response?.text?.trim();
    if (text) {
      return res.json({
        enhanced: true,
        message: text,
      });
    }
    return res.json({
      enhanced: false,
      message: getFallbackCelebration(archetype, ppd, rating, title, elapsedDays),
    });
  } catch (error) {
    console.error('Error generating AI celebration message:', error);
    return res.json({
      enhanced: false,
      message: getFallbackCelebration(archetype, ppd, rating, title, elapsedDays),
    });
  }
});

function getFallbackCelebration(archetype: string, ppd: number, rating: number, title: string, elapsedDays: number): string {
  const ratingText = rating >= 4.4 ? "a masterclass" : rating >= 3.6 ? "a deeply worthwhile journey" : "an intriguing exploration";
  const bookName = `"${title || 'this book'}"`;
  
  if (archetype?.toLowerCase().includes('comet') || ppd >= 125.0) {
    return `Supernova velocity unleashed! Burning through ${ppd} pages a day on ${bookName} in ${elapsedDays} day(s) proves you were possessed by pure literary fervor. You didn't just read this book—you orbited it at cosmic speed.`;
  } else if (archetype?.toLowerCase().includes('speed') || (ppd >= 90.0 && ppd < 125.0)) {
    return `Velocity unleashed! Blitzing through ${ppd} pages a day on ${bookName} proves you were utterly swept into the narrative vortex. You conquered this in ${elapsedDays} day(s) at lightning speed.`;
  } else if (archetype?.toLowerCase().includes('momentum') || (ppd >= 65.0 && ppd < 90.0)) {
    return `Dynamic momentum in action! Reading ${ppd} pages per day across ${elapsedDays} day(s) shows your pace accelerated as the stakes intensified. You closed this book with magnetic finale energy.`;
  } else if (archetype?.toLowerCase().includes('cruiser') || (ppd >= 45.0 && ppd < 65.0)) {
    return `Pure rhythmic mastery. Clocking in at ${ppd} pages per day across ${elapsedDays} day(s) demonstrates the golden standard of reading discipline. You navigated ${bookName} with flawless momentum, deeming it ${ratingText}.`;
  } else if (archetype?.toLowerCase().includes('lounge') || (ppd >= 30.0 && ppd < 45.0)) {
    return `Effortless immersion achieved. Sinking into ${bookName} at a comforting ${ppd} pages a day over ${elapsedDays} day(s) is pure reader bliss. Zero deadlines, total immersion.`;
  } else if (archetype?.toLowerCase().includes('sommelier') || (ppd >= 15.0 && ppd < 30.0)) {
    return `An exquisite vintage read. Taking ${elapsedDays} day(s) at ${ppd} pages a day is how true prose is meant to be savored. You gave every character and plot twist the breathing room they deserved—a true literary connoisseur's pace.`;
  } else {
    return `The ultimate self-care companion. Savoring ${bookName} gently at ${ppd} pages a day over ${elapsedDays} day(s) proves reading is your sanctuary, not a sprint. Every quiet evening chapter was a mindful gift to yourself.`;
  }
}

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PagePace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
