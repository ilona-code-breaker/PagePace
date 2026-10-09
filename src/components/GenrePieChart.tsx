import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { BookEntry } from '../types/book';
import { PieChart as PieChartIcon, BookOpen, Layers } from 'lucide-react';

interface GenrePieChartProps {
  books: BookEntry[];
  className?: string;
}

// PagePace palette: #10b981 (emerald), #06b6d4 (cyan), #ec4899 (pink), #f59e0b (amber), #8b5cf6 (violet)
const GENRE_COLORS = [
  '#10b981',
  '#06b6d4',
  '#ec4899',
  '#f59e0b',
  '#8b5cf6',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#a855f7',
  '#3b82f6',
];

interface GenreDataPoint {
  name: string;
  value: number; // book count
  percentage: number;
  totalPages: number;
}

export const GenrePieChart: React.FC<GenrePieChartProps> = ({ books, className = '' }) => {
  const { data, totalBooks, totalPages } = useMemo(() => {
    if (!books || books.length === 0) {
      return { data: [], totalBooks: 0, totalPages: 0 };
    }

    const genreMap: Record<string, { count: number; pages: number }> = {};
    let pagesSum = 0;

    books.forEach((b) => {
      const g = b.genre && b.genre.trim() ? b.genre.trim() : 'Uncategorized';
      if (!genreMap[g]) {
        genreMap[g] = { count: 0, pages: 0 };
      }
      genreMap[g].count += 1;
      genreMap[g].pages += b.totalPages || 0;
      pagesSum += b.totalPages || 0;
    });

    const total = books.length;
    const sorted: GenreDataPoint[] = Object.entries(genreMap)
      .map(([name, stats]) => ({
        name,
        value: stats.count,
        percentage: Math.round((stats.count / total) * 1000) / 10, // 1 decimal e.g. 33.3%
        totalPages: stats.pages,
      }))
      .sort((a, b) => b.value - a.value);

    return { data: sorted, totalBooks: total, totalPages: pagesSum };
  }, [books]);

  if (data.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-stone-900/60 border border-stone-800 text-center ${className}`}>
        <PieChartIcon className="w-8 h-8 text-stone-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-stone-300">No Genre Data Available</h4>
        <p className="text-xs text-stone-500 mt-1">
          Add or import books with genre tags to visualize your reading breakdown.
        </p>
      </div>
    );
  }

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: GenreDataPoint = payload[0].payload;
      return (
        <div className="bg-stone-900/95 border border-stone-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans space-y-1">
          <div className="flex items-center gap-2 font-bold text-stone-100">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: payload[0].color }}
            />
            <span>{item.name}</span>
          </div>
          <div className="text-stone-300 font-mono">
            {item.value} {item.value === 1 ? 'book' : 'books'} ({item.percentage}%)
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            {item.totalPages.toLocaleString()} total pages
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Legend formatter
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 text-xs">
        {payload.map((entry: any, index: number) => {
          const item = data.find((d) => d.name === entry.value);
          return (
            <div key={`legend-${index}`} className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-stone-300 font-sans">{entry.value}</span>
              <span className="text-stone-500 font-mono">({item ? `${item.percentage}%` : ''})</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-sm space-y-4 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-stone-100 flex items-center gap-2">
              Genre Distribution
            </h3>
            <p className="text-[11px] text-stone-400">
              Breakdown across {totalBooks} {totalBooks === 1 ? 'book' : 'books'} and {data.length} genres
            </p>
          </div>
        </div>

        {/* Top Genre Badge */}
        {data[0] && (
          <div className="text-xs font-mono px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 self-start sm:self-auto flex items-center gap-1.5">
            <span className="text-stone-500">Top Genre:</span>
            <strong className="text-amber-400">{data[0].name}</strong>
            <span className="text-stone-400 font-normal">({data[0].percentage}%)</span>
          </div>
        )}
      </div>

      {/* Donut Chart Visualization */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                  stroke="#0f1117"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Summary Chips */}
      <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-500 font-mono">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-stone-600" />
          {totalBooks} logged volumes
        </span>
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-stone-600" />
          {totalPages.toLocaleString()} total pages
        </span>
      </div>
    </div>
  );
};
