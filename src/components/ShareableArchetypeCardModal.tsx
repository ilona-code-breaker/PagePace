import React, { useRef, useEffect, useState } from 'react';
import { BookEntry } from '../types/book';
import { calculateOverallProfile, UserReadingProfile } from '../utils/userProfileUtils';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  BookOpen,
  Layers,
  Gauge,
  Star,
  Zap,
  Compass,
  Wine,
  Moon,
  Instagram,
  CheckCircle2,
} from 'lucide-react';

interface ShareableArchetypeCardModalProps {
  books: BookEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const ShareableArchetypeCardModal: React.FC<ShareableArchetypeCardModalProps> = ({
  books,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('1:1');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const profile: UserReadingProfile = calculateOverallProfile(books);
  const { archetype } = profile;

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, books, aspectRatio]);

  if (!isOpen) return null;

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

    // 1. Deep Midnight Background
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);

    // 2. Neon Radial Glow based on archetype
    const glowX = width * 0.5;
    const glowY = isStory ? height * 0.35 : height * 0.42;
    const grad = ctx.createRadialGradient(glowX, glowY, 40, glowX, glowY, width * 0.7);
    grad.addColorStop(0, archetype.glowHex || 'rgba(245, 158, 11, 0.3)');
    grad.addColorStop(0.7, 'rgba(15, 17, 23, 0.8)');
    grad.addColorStop(1, '#0f1117');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 3. Elegant Outer Border & Padding
    const margin = 48;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    // Top Brand Tag
    const topY = margin + (isStory ? 110 : 80);
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillStyle = archetype.accentHex;
    ctx.textAlign = 'center';
    ctx.fillText('PAGEPACE • READING ARCHETYPE REPORT', width / 2, topY);

    // 4. Primary Archetype Badge & Emoji
    const badgeY = topY + (isStory ? 120 : 90);

    // Archetype Icon circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, badgeY, 44, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = archetype.accentHex;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(archetype.badgeEmoji || '✨', width / 2, badgeY + 14);

    // Archetype Title
    const titleY = badgeY + 90;
    ctx.font = '800 58px "Fraunces", Georgia, serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(archetype.name.toUpperCase(), width / 2, titleY);

    // Velocity Subtitle
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillStyle = archetype.accentHex;
    ctx.fillText(
      `${profile.overallPpd.toFixed(1)} PPD · ${archetype.ppdRange}`,
      width / 2,
      titleY + 44
    );

    // Tagline in Quotes
    ctx.font = 'italic 26px "Fraunces", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`“${archetype.tagline}”`, width / 2, titleY + 95);

    // 5. Stat Metric Grid (4 core metrics)
    const statsY = isStory ? titleY + 220 : titleY + 160;
    const boxW = 220;
    const boxH = 140;
    const gap = 20;
    const startX = (width - (4 * boxW + 3 * gap)) / 2;

    const statItems = [
      { label: 'BOOKS READ', val: `${profile.totalBooks}`, sub: profile.totalBooks === 1 ? 'volume' : 'volumes' },
      { label: 'TOTAL PAGES', val: profile.totalPages.toLocaleString(), sub: 'pages' },
      { label: 'READING PACE', val: `${profile.overallPpd.toFixed(1)}`, sub: 'PPD' },
      { label: 'AVG RATING', val: `★ ${profile.averageRating.toFixed(1)}`, sub: '/ 5.0' },
    ];

    statItems.forEach((st, idx) => {
      const bx = startX + idx * (boxW + gap);
      // Box Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(bx, statsY, boxW, boxH);
      ctx.strokeStyle = idx === 2 ? archetype.accentHex : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, statsY, boxW, boxH);

      // Label
      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, bx + boxW / 2, statsY + 36);

      // Value
      ctx.font = '700 36px "JetBrains Mono", monospace';
      ctx.fillStyle = idx === 2 ? archetype.accentHex : '#f8fafc';
      ctx.fillText(st.val, bx + boxW / 2, statsY + 84);

      // Sub
      ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(st.sub, bx + boxW / 2, statsY + 115);
    });

    // 6. Top Genres breakdown
    const genreY = statsY + boxH + (isStory ? 80 : 50);
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('TOP READING GENRES', width / 2, genreY);

    if (profile.topGenres.length > 0) {
      const genreBoxY = genreY + 24;
      const chipHeight = 44;
      const chipPadding = 30;
      const chipSpacing = 16;

      // Measure chips
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      const chipWidths = profile.topGenres.map(
        (g) => ctx.measureText(`${g.genre} (${g.percent}%)`).width + chipPadding * 2
      );
      const totalChipsWidth =
        chipWidths.reduce((a, b) => a + b, 0) + chipSpacing * (profile.topGenres.length - 1);
      let chipX = (width - totalChipsWidth) / 2;

      profile.topGenres.forEach((g, i) => {
        const cWidth = chipWidths[i];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(chipX, genreBoxY, cWidth, chipHeight);
        ctx.strokeStyle = archetype.accentHex;
        ctx.lineWidth = 1;
        ctx.strokeRect(chipX, genreBoxY, cWidth, chipHeight);

        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(`${g.genre} (${g.percent}%)`, chipX + cWidth / 2, genreBoxY + 28);

        chipX += cWidth + chipSpacing;
      });
    }

    // 7. Philosophy / Insight quote (shown predominantly in 9:16 story layout)
    if (isStory && archetype.celebrationPhilosophy) {
      const philY = genreY + 160;
      ctx.font = 'italic 22px "Fraunces", Georgia, serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';

      // Simple text wrap
      const words = archetype.celebrationPhilosophy.split(' ');
      let line = '';
      let curY = philY;
      const maxW = width - 240;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && n > 0) {
          ctx.fillText(line, width / 2, curY);
          line = words[n] + ' ';
          curY += 34;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, curY);
    }

    // 8. Subtle Watermark & App Branding at bottom ('Tracked with PagePace')
    const footerY = height - margin - 35;
    ctx.font = '600 19px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Tracked with PagePace • Reading Velocity & Archetypes', width / 2, footerY);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pagepace_archetype_${aspectRatio === '9:16' ? 'story' : 'post'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(profile.summaryCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2400);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 flex items-center gap-2">
                Shareable Reading Archetype Card
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Export your personal reading persona & statistics as an image or social caption.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Format Tabs (Post 1:1 vs Story 9:16) */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAspectRatio('1:1')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                aspectRatio === '1:1'
                  ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Square Post (1:1)</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                aspectRatio === '9:16'
                  ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Vertical Story (9:16)</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCaption}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                copiedCaption
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-200 border-stone-750'
              }`}
              title="Copy formatted summary with stats & hashtags"
            >
              {copiedCaption ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-400" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Card as Image</span>
            </button>
          </div>
        </div>

        {/* Live Canvas Visual Preview Area */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-stone-950/70 border border-stone-800/80 rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className={`shadow-2xl rounded-xl border border-stone-800 max-w-full object-contain ${
              aspectRatio === '9:16' ? 'max-h-[520px]' : 'max-h-[460px]'
            }`}
          />
          <div className="mt-3 text-[11px] text-stone-500 font-mono text-center">
            High-Resolution 1080px Canvas • Branded with “Tracked with PagePace”
          </div>
        </div>

        {/* Social Caption Preview Box */}
        <div className="p-4 rounded-2xl bg-stone-950/50 border border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
              Ready-to-Paste Social Caption
            </span>
            <span>Instagram · LinkedIn · Threads</span>
          </div>
          <pre className="text-xs text-stone-300 font-sans whitespace-pre-wrap leading-relaxed select-all bg-stone-900/60 p-3 rounded-xl border border-stone-800/60">
            {profile.summaryCaption}
          </pre>
        </div>
      </div>
    </div>
  );
};
