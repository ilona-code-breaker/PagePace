import React, { useRef, useEffect, useState } from 'react';
import { BookEntry, ArchetypeDefinition } from '../types/book';
import { Download, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';

interface StoryCardCanvasProps {
  book: BookEntry;
  archetype: ArchetypeDefinition;
}

export const StoryCardCanvas: React.FC<StoryCardCanvasProps> = ({ book, archetype }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1'>('9:16');
  const [copiedImage, setCopiedImage] = useState(false);

  useEffect(() => {
    renderCanvas();
  }, [book, archetype, aspectRatio]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isStory = aspectRatio === '9:16';
    const width = 1080;
    const height = isStory ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    // Background base
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh gradient
    const grad = ctx.createRadialGradient(
      width * 0.5,
      isStory ? 450 : 350,
      50,
      width * 0.5,
      isStory ? 600 : 450,
      width * 0.75
    );
    grad.addColorStop(0, archetype.glowHex || 'rgba(245, 158, 11, 0.25)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Vignette bottom gradient
    const botGrad = ctx.createLinearGradient(0, height - 300, 0, height);
    botGrad.addColorStop(0, 'transparent');
    botGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, 0, width, height);

    // Inner Card Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Corner Ornaments
    ctx.strokeStyle = archetype.accentHex;
    ctx.lineWidth = 3;
    const corner = 30;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(40, 40 + corner);
    ctx.lineTo(40, 40);
    ctx.lineTo(40 + corner, 40);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 40 - corner, 40);
    ctx.lineTo(width - 40, 40);
    ctx.lineTo(width - 40, 40 + corner);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(40, height - 40 - corner);
    ctx.lineTo(40, height - 40);
    ctx.lineTo(40 + corner, height - 40);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 40 - corner, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.lineTo(width - 40, height - 40 - corner);
    ctx.stroke();

    // App Header Kicker
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = archetype.accentHex;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('PAGEPACE • VERIFIED READING STATS', width / 2, isStory ? 120 : 90);
    ctx.letterSpacing = '0px';

    // Archetype Icon Badge
    const badgeY = isStory ? 240 : 170;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(width / 2, badgeY, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = archetype.accentHex;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(archetype.badgeEmoji, width / 2, badgeY);

    // Archetype Name
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 44px "Cinzel", "Fraunces", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(archetype.name.toUpperCase(), width / 2, badgeY + 105);

    // Archetype Tagline
    ctx.font = 'italic 400 24px "Fraunces", Georgia, serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`“${archetype.tagline}”`, width / 2, badgeY + 150);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, badgeY + 185);
    ctx.lineTo(width / 2 + 150, badgeY + 185);
    ctx.stroke();

    // Book Title Box
    const bookY = badgeY + (isStory ? 270 : 230);
    ctx.font = '700 48px "Fraunces", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    
    // Wrap title if needed
    wrapText(ctx, `《${book.title}》`, width / 2, bookY, width - 180, 56);

    // Author
    if (book.author) {
      ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#a8a29e';
      ctx.fillText(`by ${book.author}`, width / 2, bookY + 65);
    }

    // 4 Key Stats Badges
    const statsY = isStory ? 880 : 580;
    const boxW = 210;
    const boxH = 140;
    const gap = 20;
    const startX = (width - (4 * boxW + 3 * gap)) / 2;

    const statItems = [
      { label: 'TOTAL PAGES', val: `${book.totalPages}`, sub: 'pages' },
      { label: 'DURATION', val: `${book.elapsedDays}`, sub: book.elapsedDays === 1 ? 'day' : 'days' },
      { label: 'READING PACE', val: `${book.ppd.toFixed(1)}`, sub: 'PPD' },
      { label: 'RATING', val: `${book.rating.toFixed(1)}`, sub: '/ 5.0' },
    ];

    statItems.forEach((st, idx) => {
      const bx = startX + idx * (boxW + gap);
      // Box background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(bx, statsY, boxW, boxH);
      ctx.strokeStyle = idx === 2 ? archetype.accentHex : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, statsY, boxW, boxH);

      // Label
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#78716c';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, bx + boxW / 2, statsY + 36);

      // Value
      ctx.font = '700 38px "JetBrains Mono", monospace';
      ctx.fillStyle = idx === 2 ? archetype.accentHex : '#f5f5f4';
      ctx.fillText(st.val, bx + boxW / 2, statsY + 84);

      // Sub
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#a8a29e';
      ctx.fillText(st.sub, bx + boxW / 2, statsY + 115);
    });

    // Reader Stars Graphic
    const starY = statsY + boxH + 60;
    const starCount = Math.round(book.rating);
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    let starStr = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
    ctx.fillText(`${starStr}   (${book.rating.toFixed(1)} / 5.0)`, width / 2, starY);

    // Review / Quote box
    if (book.review && book.review.trim()) {
      const quoteY = starY + 60;
      const quoteBoxW = width - 200;
      const quoteBoxH = isStory ? 320 : 180;
      const qx = 100;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(qx, quoteY, quoteBoxW, quoteBoxH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(qx, quoteY, quoteBoxW, quoteBoxH);

      ctx.font = 'italic 24px "Fraunces", Georgia, serif';
      ctx.fillStyle = '#e7e5e4';
      wrapText(ctx, `“${book.review.trim()}”`, width / 2, quoteY + 60, quoteBoxW - 60, 36);
    }

    // Celebration message excerpt on story mode
    if (isStory && book.celebrationMessage) {
      const celY = height - 260;
      ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      wrapText(ctx, book.celebrationMessage, width / 2, celY, width - 240, 30);
    }

    // Footer Watermark
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#78716c';
    ctx.textAlign = 'center';
    ctx.fillText('#PagePace • Gamified Reading Velocities', width / 2, height - 70);
  };

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pagepace-${archetype.id}-${book.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2200);
      });
    } catch {
      // Fallback: download if copy image item is restricted
      handleDownload();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Aspect Ratio Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-lg">
        <button
          type="button"
          onClick={() => setAspectRatio('9:16')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            aspectRatio === '9:16'
              ? 'bg-stone-800 text-stone-100 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          9:16 Story (IG & TikTok)
        </button>
        <button
          type="button"
          onClick={() => setAspectRatio('1:1')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            aspectRatio === '1:1'
              ? 'bg-stone-800 text-stone-100 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          1:1 Square (Feed Post)
        </button>
      </div>

      {/* Canvas Display with crisp aspect container */}
      <div className="relative max-h-[520px] overflow-hidden rounded-2xl border border-stone-800 shadow-2xl bg-stone-950 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          className="max-h-[500px] w-auto h-auto object-contain rounded-xl"
          style={{ maxHeight: '480px' }}
        />
      </div>

      {/* Download and Action Controls */}
      <div className="flex items-center gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all shadow-md active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopyImage}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition-colors border border-stone-700 active:scale-95"
          title="Copy image to clipboard"
        >
          {copiedImage ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
