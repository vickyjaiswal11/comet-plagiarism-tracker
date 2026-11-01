import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Sparkles, 
  FileText, 
  Loader2, 
  X,
  AlertCircle,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { PlagiarismReport, analyzePlagiarism } from '../utils/plagiarism';
import type { OriginalSource } from '../utils/documents';
import { Button } from '@/components/ui/button';
import { parseUploadedFile, FileParseResult } from '../utils/fileParser';
import { UserProfile } from '../utils/userProfile';

interface ScannerProps {
  userProfile: UserProfile | null;
  sources: OriginalSource[];
  onOpenSources: () => void;
  onScanComplete: (report: PlagiarismReport) => Promise<void>;
  onCancel: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ userProfile, sources, onOpenSources, onScanComplete, onCancel }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(userProfile?.name || '');
  const [content, setContent] = useState('');
  
  // File state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<FileParseResult | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;

  const processFile = async (file: File) => {
    setIsParsingFile(true);
    setErrorMsg(null);
    try {
      const parsed = await parseUploadedFile(file);
      if (!parsed.text || parsed.wordCount === 0) {
        throw new Error('Could not find readable text in this file. Please ensure it is a valid document.');
      }
      setContent(parsed.text);
      setUploadedFileMeta(parsed);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not read file. Supported formats: PDF, DOCX, CSV, TXT.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClearUploadedFile = () => {
    setUploadedFileMeta(null);
    setContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartScan = async () => {
    if (!content.trim()) {
      setErrorMsg('Please upload a document or paste text to scan.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const docTitle = title.trim() || uploadedFileMeta?.fileName?.replace(/\.[^/.]+$/, '') || 'Untitled Manuscript';
      const docAuthor = author.trim() || userProfile?.name || 'Author';

      // Run the similarity engine and append a block to the browser blockchain ledger.
      await new Promise((r) => setTimeout(r, 400));
      const report = await analyzePlagiarism(content, sources, {
        title: docTitle,
        author: docAuthor,
        department: userProfile?.department || 'Research',
        userId: userProfile?.id,
      });
      await onScanComplete(report);
    } catch (err: any) {
      setIsScanning(false);
      setErrorMsg(err.message || 'Error occurred while checking plagiarism.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Simple, un-congested header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Check for Plagiarism</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload your paper or paste text to check originality and find matching sources.
          </p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm text-muted-foreground">
        <span>All original files: {sources.length}</span>
        <Button variant="outline" size="sm" onClick={onOpenSources}>Manage originals</Button>
      </div>
      {!sources.length && <p role="status" className="text-destructive text-sm">Add original sources before checking a paper.</p>}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Upload & Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
        {/* Document Details Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Document Title <span className="text-slate-500 text-[11px]">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Analysis of Neural Networks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Author Name <span className="text-slate-500 text-[11px]">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* File Drag & Drop Upload Zone */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Upload Document File
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-950/20'
                : uploadedFileMeta
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.csv,.txt,.md,.text,.json"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {isParsingFile ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                <span className="text-xs text-slate-300">Reading document text...</span>
              </div>
            ) : uploadedFileMeta ? (
              <div className="flex items-center justify-between max-w-sm mx-auto bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {uploadedFileMeta.fileType}
                  </div>
                  <div>
                    <div className="font-semibold text-white truncate max-w-[190px]">
                      {uploadedFileMeta.fileName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {uploadedFileMeta.wordCount.toLocaleString()} words loaded
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearUploadedFile();
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Click to upload or drag and drop a file
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PDF, Word (.doc / .docx), CSV, JSON, TXT and Markdown
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Or Paste Paper Text</span>
            </label>
            <div className="text-[11px] text-slate-400">
              <span>{wordCount.toLocaleString()} words</span>
              <span className="mx-1.5">•</span>
              <span>{charCount.toLocaleString()} characters</span>
            </div>
          </div>

          <textarea
            rows={7}
            placeholder="Paste your paper or document text here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
          ></textarea>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isScanning || isParsingFile || !content.trim() || !sources.length}
            onClick={handleStartScan}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Check Plagiarism</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
