import React, { useState, useRef, useCallback } from 'react';
import { BookEntry } from '../types/book';
import {
  parseCsvRaw,
  analyzeAndNormalizeCsv,
  partitionDuplicates,
  convertRowToBookEntry,
  CsvParseOptions,
  CsvAnalysisResult,
  NormalizedCsvRow,
} from '../utils/csvParser';
import { enrichCsvGenres } from '../utils/enrichCsvGenres';
import { ARCHETYPES } from '../constants/archetypes';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Filter,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBooks: BookEntry[];
  onImportComplete: (updatedBooks: BookEntry[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingBooks,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse Options
  const [options, setOptions] = useState<CsvParseOptions>({
    startDateStrategy: 'infer_date_added',
    defaultPageCountFallback: 350,
    importShelfFilter: 'read_only',
  });

  // Parsed Analysis
  const [rawRows, setRawRows] = useState<string[][] | null>(null);
  const [analysis, setAnalysis] = useState<CsvAnalysisResult | null>(null);

  // Import Merge Strategy
  const [mergeStrategy, setMergeStrategy] = useState<'merge_skip' | 'merge_update' | 'replace'>('merge_skip');

  // Batch Progress State
  const [isImporting, setIsImporting] = useState(false);
  const [autoEnrichGenres, setAutoEnrichGenres] = useState(true);
  const [progressStage, setProgressStage] = useState<'parsing' | 'enriching' | null>(null);
  const [progressTitle, setProgressTitle] = useState<string>('');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Process file with client-side parser
  const processCsvFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file (e.g. goodreads_library_export.csv).');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          setError('The selected CSV file is empty.');
          setIsParsing(false);
          return;
        }

        const parsed = parseCsvRaw(text);
        if (parsed.length < 2) {
          setError('The CSV file does not contain enough rows or headers to import.');
          setIsParsing(false);
          return;
        }

        setRawRows(parsed);
        const result = analyzeAndNormalizeCsv(parsed, options);
        setAnalysis(result);

        if (result.validRows.length === 0) {
          setError(
            'No matching book records found. Please ensure the CSV contains a Title column and book entries.'
          );
        }
      } catch (err: any) {
        setError(`Failed to parse CSV file: ${err.message || 'Unknown error'}`);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file from disk.');
      setIsParsing(false);
    };

    reader.readAsText(selectedFile);
  };

  const handleOptionChange = (newOptions: Partial<CsvParseOptions>) => {
    const updated = { ...options, ...newOptions };
    setOptions(updated);
    if (rawRows) {
      const result = analyzeAndNormalizeCsv(rawRows, updated);
      setAnalysis(result);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvFile(e.dataTransfer.files[0]);
    }
  };

  // Perform Final Import with asynchronous batching
  const handleExecuteImport = async () => {
    if (!analysis || analysis.validRows.length === 0) return;

    setIsImporting(true);
    const rowsToProcess = analysis.validRows;
    const total = rowsToProcess.length;

    // Asynchronous chunking to ensure zero UI freeze for large files (e.g. 100+ books)
    const convertedBooks: BookEntry[] = [];
    const chunkSize = 40;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = rowsToProcess.slice(i, i + chunkSize);
      chunk.forEach((row, chunkIdx) => {
        convertedBooks.push(convertRowToBookEntry(row, i + chunkIdx));
      });

      setImportProgress({ current: Math.min(i + chunkSize, total), total });

      // Yield thread to UI
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    let finalLibrary: BookEntry[] = [];

    if (mergeStrategy === 'replace') {
      finalLibrary = convertedBooks;
    } else if (mergeStrategy === 'merge_skip') {
      const { newBooks } = partitionDuplicates(rowsToProcess, existingBooks);
      const newBookEntries = newBooks.map((r, i) => convertRowToBookEntry(r, i));
      finalLibrary = [...newBookEntries, ...existingBooks];
    } else {
      // merge_update
      const updatedMap = new Map<string, BookEntry>();
      // Seed existing
      existingBooks.forEach((b) => updatedMap.set(b.id, b));

      // Overwrite matching or add new
      const { newBooks, duplicates } = partitionDuplicates(rowsToProcess, existingBooks);
      duplicates.forEach(({ incoming, existingBook }, i) => {
        const updated = convertRowToBookEntry(incoming, i);
        updated.id = existingBook.id; // Preserve ID
        updatedMap.set(existingBook.id, updated);
      });
      newBooks.forEach((incoming, i) => {
        const added = convertRowToBookEntry(incoming, i);
        updatedMap.set(added.id, added);
      });

      finalLibrary = Array.from(updatedMap.values());
    }

    // Optional Master Genre Auto-Enrichment via Google Books / Open Library
    let processedLibrary: BookEntry[] = finalLibrary;
    if (autoEnrichGenres && finalLibrary.length > 0) {
      setProgressStage('enriching');
      const { enrichedBooks } = await enrichCsvGenres(finalLibrary, {
        batchSize: 4,
        onProgress: (p) => {
          setImportProgress({ current: p.processed, total: p.total });
          setProgressTitle(p.currentTitle || '');
        },
      });
      processedLibrary = enrichedBooks;
    }

    setIsImporting(false);
    setProgressStage(null);
    setProgressTitle('');
    onImportComplete(processedLibrary);
    onClose();
  };

  const duplicateStats = analysis
    ? partitionDuplicates(analysis.validRows, existingBooks)
    : { newBooks: [], duplicates: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 flex items-center gap-2">
                Import CSV Reading History
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Upload your Goodreads export or custom spreadsheet to calculate dynamic velocity archetypes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client-Side Privacy Notice Micro-copy */}
        <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center gap-2.5 text-xs text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-stone-300">100% Client-Side Privacy:</strong> Your file is parsed locally on your device and never uploaded to any server.
          </span>
        </div>

        {/* Step 1: File Dropzone (if no file loaded or changing file) */}
        {!analysis ? (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processCsvFile(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                  : 'border-stone-800 hover:border-amber-500/50 bg-stone-950/60 hover:bg-stone-950'
              }`}
            >
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 mb-3 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-stone-100">
                Drag and drop your reading CSV file here
              </h4>
              <p className="text-xs text-stone-400 mt-1 max-w-sm">
                Compatible with standard Goodreads exports (<code className="text-amber-400 font-mono text-[11px]">goodreads_library_export.csv</code>) or custom spreadsheets with Title & Author columns.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors border border-stone-700"
              >
                Browse CSV File
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Inspection, Settings & Preview */
          <div className="space-y-5">
            {/* Analysis Stats Overview Banner */}
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-100 font-serif">
                    {file?.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {analysis.validRows.length} Books Ready
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 font-mono flex items-center gap-3">
                  <span>Total rows: {analysis.totalRows}</span>
                  <span>·</span>
                  <span>'Read' shelf: {analysis.readCount}</span>
                  {analysis.currentlyReadingCount > 0 && (
                    <>
                      <span>·</span>
                      <span>Currently reading: {analysis.currentlyReadingCount}</span>
                    </>
                  )}
                  {analysis.toReadCount > 0 && (
                    <>
                      <span>·</span>
                      <span>To read: {analysis.toReadCount}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAnalysis(null);
                  setRawRows(null);
                  setFile(null);
                }}
                className="text-xs text-stone-400 hover:text-stone-200 underline font-mono"
              >
                Change File
              </button>
            </div>

            {/* Velocity & Page Assumptions Controls */}
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Velocity & Reading Calculation Assumptions
                </span>
                <span className="text-[11px] text-stone-500">Goodreads Pacing Fixes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Velocity Start Date Assumption */}
                <div className="space-y-1.5">
                  <label className="text-stone-300 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    When Start Date is Missing in CSV:
                  </label>
                  <select
                    value={options.startDateStrategy}
                    onChange={(e) =>
                      handleOptionChange({
                        startDateStrategy: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="infer_date_added">
                      Infer duration from "Date Added" (if earlier)
                    </option>
                    <option value="same_day">
                      Assume 1-day read (Finish Date = Start Date)
                    </option>
                    <option value="estimate_pace">
                      Estimate duration by page count (~50 PPD)
                    </option>
                  </select>
                  <span className="text-[11px] text-stone-500 block">
                    Prevents NaN/infinite velocity on past Goodreads imports.
                  </span>
                </div>

                {/* Page Count Fallback */}
                <div className="space-y-1.5">
                  <label className="text-stone-300 font-medium flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    Fallback Pages (When blank in CSV):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      value={options.defaultPageCountFallback}
                      onChange={(e) =>
                        handleOptionChange({
                          defaultPageCountFallback: Math.max(10, parseInt(e.target.value, 10) || 350),
                        })
                      }
                      className="w-24 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="text-[11px] text-stone-400">
                      Auto-filled via PagePace Knowledge Base first
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    {analysis.missingPagesCount > 0
                      ? `${analysis.missingPagesCount} books lacked page counts in CSV.`
                      : 'All rows had valid page counts.'}
                  </span>
                </div>
              </div>

              {/* Shelf Filter Toggle */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-stone-400" />
                  Import Filter:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOptionChange({ importShelfFilter: 'read_only' })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      options.importShelfFilter === 'read_only'
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Completed Books Only ('read' shelf)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionChange({ importShelfFilter: 'all' })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      options.importShelfFilter === 'all'
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    All Shelves
                  </button>
                </div>
              </div>

              {/* Master Genre Auto-Enrichment Toggle */}
              <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-stone-300 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Enrich Missing Genres (Master Genres):
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Auto-categorizes blank/generic genres into Fantasy, Sci-Fi, Romance, etc. via Google Books & Open Library.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoEnrichGenres(!autoEnrichGenres)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto ${
                    autoEnrichGenres
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  {autoEnrichGenres ? 'Enabled (API Auto-lookup)' : 'Disabled (Use CSV Only)'}
                </button>
              </div>
            </div>

            {/* Deduplication Choice Panel */}
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Library Merging & Duplicates
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {duplicateStats.duplicates.length > 0 ? (
                    <strong className="text-amber-400">
                      {duplicateStats.duplicates.length} duplicate(s) detected
                    </strong>
                  ) : (
                    <span className="text-emerald-400">0 duplicates found</span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  onClick={() => setMergeStrategy('merge_skip')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors space-y-1 ${
                    mergeStrategy === 'merge_skip'
                      ? 'bg-amber-500/10 border-amber-500/50 text-stone-100'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Merge (Skip Duplicates)</span>
                    {mergeStrategy === 'merge_skip' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Adds only {duplicateStats.newBooks.length} new books. Leaves your existing books unchanged.
                  </p>
                </label>

                <label
                  onClick={() => setMergeStrategy('merge_update')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors space-y-1 ${
                    mergeStrategy === 'merge_update'
                      ? 'bg-amber-500/10 border-amber-500/50 text-stone-100'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Merge & Update</span>
                    {mergeStrategy === 'merge_update' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Adds new books and updates matching existing books with the latest CSV dates/reviews.
                  </p>
                </label>

                <label
                  onClick={() => setMergeStrategy('replace')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors space-y-1 ${
                    mergeStrategy === 'replace'
                      ? 'bg-rose-500/10 border-rose-500/50 text-stone-100'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between text-rose-300">
                    <span>Replace Entire Library</span>
                    {mergeStrategy === 'replace' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Replaces current library with all {analysis.validRows.length} books from this CSV.
                  </p>
                </label>
              </div>
            </div>

            {/* Preview of Top 4 Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-mono uppercase tracking-wider text-stone-400 font-semibold">
                  Preview Sample ({analysis.validRows.length} records)
                </span>
                <span>Showing first 4 records</span>
              </div>

              <div className="divide-y divide-stone-800 rounded-xl border border-stone-800 bg-stone-950 overflow-hidden text-xs">
                {analysis.validRows.slice(0, 4).map((r, i) => {
                  const arch = ARCHETYPES[r.archetypeId] || ARCHETYPES['steady-cruiser'];
                  return (
                    <div key={i} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-serif font-bold text-stone-200 truncate">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                          by {r.author} · {r.totalPages} pages {r.hasAutoFilledPages && '(auto-filled)'} · Finished {r.finishDate}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-amber-400 font-semibold">
                          {r.ppd.toFixed(1)} PPD
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {arch.shortName} · ★ {r.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Batch Progress Bar during Execution */}
            {isImporting && importProgress && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-300 font-mono">
                  <span>
                    {progressStage === 'enriching'
                      ? `Enriching genres via Google Books API (${importProgress.current} / ${importProgress.total})...`
                      : `Importing row ${importProgress.current} of ${importProgress.total}...`}
                  </span>
                  <span>
                    {importProgress.total > 0
                      ? `${Math.round((importProgress.current / importProgress.total) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                {progressTitle && (
                  <div className="text-[11px] text-stone-400 truncate font-sans">
                    Inspecting metadata for: <em className="text-stone-200">{progressTitle}</em>
                  </div>
                )}
                <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-150"
                    style={{
                      width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || analysis.validRows.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing CSV...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      Import {analysis.validRows.length} Books to Library
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
