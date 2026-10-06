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
- Reader Rating: ${rating} / 5.0 (0.2 precision scale)
- Reader Review / Thoughts: "${review || 'No written notes.'}"

Generate a short, warm, and highly personalized celebration message (2-3 punchy sentences) that:
1. Validates and honors their reading style (CRITICAL: never judge slower readers; celebrate Book Sommeliers for their deep attention and Bedtime Tasters for mindful self-care, while celebrating Speed Readers for momentum and Steady Cruisers for consistency).
2. Connects their ${rating}/5.0 rating and thoughts to their pace.
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
  
  if (archetype?.toLowerCase().includes('speed') || ppd >= 80) {
    return `Velocity unleashed! Burning through ${ppd} pages a day on "${title || 'this book'}" proves you were utterly swept into the narrative vortex. You didn't just read this in ${elapsedDays} days—you conquered it at rocket speed.`;
  } else if (archetype?.toLowerCase().includes('cruiser') || (ppd >= 40 && ppd < 80)) {
    return `Pure rhythmic mastery. Clocking in at ${ppd} pages per day across ${elapsedDays} days demonstrates the golden standard of reading discipline. You navigated "${title || 'this story'}" with flawless momentum, deeming it ${ratingText}.`;
  } else if (archetype?.toLowerCase().includes('sommelier') || (ppd >= 15 && ppd < 40)) {
    return `An exquisite vintage read. Taking ${elapsedDays} days at ${ppd} pages a day is how true prose is meant to be savored. You gave every character and plot twist the breathing room they deserved—a true literary connoisseur's pace.`;
  } else {
    return `The ultimate self-care companion. Savoring "${title || 'this book'}" gently at ${ppd} pages a day over ${elapsedDays} days proves reading is your sanctuary, not a sprint. Every quiet evening chapter was a mindful gift to yourself.`;
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
