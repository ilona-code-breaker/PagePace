import React, { useRef, useState } from 'react';
import { BookEntry, MonthlyGoal } from '../types/book';
import { exportPagePaceData, validateAndParseImport } from '../utils/dataPortability';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  FileJson,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

interface DataPortabilityToolbarProps {
  books: BookEntry[];
  goals: Record<string, MonthlyGoal>;
  onDataImported: (data: { books: BookEntry[]; goals: Record<string, MonthlyGoal> }) => void;
  className?: string;
}

export const DataPortabilityToolbar: React.FC<DataPortabilityToolbarProps> = ({
  books,
  goals,
  onDataImported,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    books: BookEntry[];
    goals: Record<string, MonthlyGoal>;
    fileName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleExport = () => {
    exportPagePaceData(books, goals);
    setSuccessToast(`Exported ${books.length} books to JSON file.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseImport(content);

      if (!result.valid || !result.data) {
        setErrorMessage(result.error || 'Failed to parse file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Valid structure found: open confirmation modal
      setPendingImport({
        books: result.data.books,
        goals: result.data.goals,
        fileName: file.name,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file from disk.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;

    // Apply import
    onDataImported({
      books: pendingImport.books,
      goals: pendingImport.goals,
    });

    setSuccessToast(`Successfully imported ${pendingImport.books.length} books!`);
    setPendingImport(null);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Export Data Button */}
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
        title="Download your complete reading history as JSON"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>Export Data</span>
      </button>

      {/* Import Data Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
        title="Import reading history from a PagePace JSON backup"
      >
        <Upload className="w-3.5 h-3.5 text-emerald-400" />
        <span>Import Data</span>
      </button>

      {/* Success Feedback Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Alert Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-stone-100">Import Failed</h4>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
              {errorMessage}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Overwrite Modal */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-100">
                    Confirm Data Import
                  </h4>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {pendingImport.fileName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-300 space-y-2">
              <p className="font-semibold text-amber-300">
                Importing will overwrite your current saved data. Proceed?
              </p>
              <div className="font-mono text-[11px] text-stone-400 space-y-0.5">
                <div>• New Books: <strong>{pendingImport.books.length}</strong></div>
                <div>• Monthly Goals: <strong>{Object.keys(pendingImport.goals).length}</strong></div>
                <div>• Current Books to be replaced: <strong>{books.length}</strong></div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Proceed & Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
