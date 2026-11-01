import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { createTeacherReport, deliverFile } from '../utils/downloads';
import { 
  ArrowLeft, 
  Award, 
  Blocks, 
  FileCheck2, 
  AlertTriangle, 
  ShieldAlert, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  FileText, 
  BookOpen, 
  Sparkles,
  Info,
  BrainCircuit,
  Layers,
  Link2,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { PlagiarismReport, MatchedPassage, getLedger, verifyChain, DocBlock } from '../utils/plagiarism';
import { AiAnalysisPanel } from './AiAnalysisPanel';

interface ReportDetailProps {
  report: PlagiarismReport;
  onBack: () => void;
  onOpenCertificate: (report: PlagiarismReport) => void;
  onDeleteReport: (report: PlagiarismReport) => Promise<void>;
}

export const ReportDetail: React.FC<ReportDetailProps> = ({
  report,
  onBack,
  onOpenCertificate,
  onDeleteReport,
}) => {
  const [wordReport, setWordReport] = useState<Blob | null>(null);
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setWordReport(null);
    setDownloadError('');
    createTeacherReport(report).then(blob => { if (!cancelled) setWordReport(blob); }).catch(() => { if (!cancelled) setDownloadError('Could not prepare Word report. Please reopen this report to retry.'); });
    return () => { cancelled = true; };
  }, [report]);

  const [activeSubTab, setActiveSubTab] = useState<'comparison' | 'ai' | 'blockchain'>('comparison');
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(
    report.matchedPassages[0]?.id ?? null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [ledger, setLedger] = useState<DocBlock[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (activeSubTab === 'blockchain') {
      const l = getLedger();
      setLedger(l);
      setChainValid(verifyChain(l));
    }
  }, [activeSubTab]);

  const isClean = report.riskLevel === 'Clean';
  const isModerate = report.riskLevel === 'Moderate';
  const isHigh = report.riskLevel === 'High';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sentences = report.content.split(/(?<=[.!?])\s+/).filter(Boolean);
  const activePassage = report.matchedPassages.find(p => p.id === selectedPassageId);

  const thisBlock = report.block;
  /** Legacy reports (saved before the blockchain ledger update) won't have report.block */
  const hasBlock = !!thisBlock;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tracked Reports</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={!wordReport} onClick={() => { if (wordReport) void deliverFile(wordReport, `Comet-report-${report.id}.docx`); }}><Download />{wordReport ? 'Download Word report (.docx)' : 'Preparing Word report…'}</Button>
          <Button variant="ghost" size="icon" title="Delete document" aria-label={`Delete document ${report.title}`} onClick={() => onDeleteReport(report)}><Trash2 className="text-destructive" /></Button>

          <button
            onClick={() => onOpenCertificate(report)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Certificate of Originality</span>
          </button>
        </div>
      </div>
      {downloadError && <p role="alert" className="text-destructive text-sm">{downloadError}</p>}
      <p className="text-sm text-muted-foreground">{report.referenceSources ? `Checked against ${report.referenceSources.length} uploaded original source(s).` : 'Legacy report: checked before the original-source library was added.'}</p>
      {report.referenceSources && <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">All originals checked ({report.referenceSources.length})</summary>
        <ul className="mt-2 space-y-1 pl-5 list-disc">{report.referenceSources.map(source => <li key={source.id} className="break-words">{source.title}</li>)}</ul>
      </details>}

      {/* Main Report Header & Metrics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                {report.id}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  isClean
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : isModerate
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {isClean ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{report.riskLevel} Risk ({report.status})</span>
              </span>
              <span className="text-xs text-slate-400">
                Audited: {new Date(report.submittedAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">{report.title}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span>Author: <strong className="text-slate-200">{report.author}</strong></span>
              <span>•</span>
              <span>Faculty: <strong className="text-slate-200">{report.department}</strong></span>
              <span>•</span>
              <span>Words: <strong className="text-slate-200">{report.wordCount.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Similarity & Originality Score Cards */}
          <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 shrink-0">
            <div className="text-center px-4 border-r border-slate-800">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Similarity</div>
              <div
                className={`text-3xl font-extrabold mt-0.5 ${
                  isClean ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {report.similarityScore}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Matched Corpus</div>
            </div>

            <div className="text-center px-4">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Originality</div>
              <div className="text-3xl font-extrabold text-white mt-0.5">
                {report.originalityScore}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Within checked sources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'comparison'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Side-by-Side Comparison</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span>AI Writing Diagnostic</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold">
            AI
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('blockchain')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'blockchain'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Blocks className="w-4 h-4 text-indigo-400" />
          <span>Blockchain Ledger</span>
        </button>
      </div>

      {/* View 1: Side-by-Side Comparison */}
      {activeSubTab === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Submitted Manuscript View with Highlights */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Submitted Manuscript Text (Interactive Highlights)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click any highlighted sentence to inspect source
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs leading-relaxed text-slate-300 font-sans space-y-2 flex-1 overflow-y-auto max-h-[500px]">
              {sentences.length === 0 ? (
                <p className="text-slate-500 italic">No text content available.</p>
              ) : (
                <p className="space-x-1">
                  {sentences.map((sent, idx) => {
                    const matched = report.matchedPassages.find(
                      p => p.suspiciousText.trim().toLowerCase().includes(sent.trim().toLowerCase()) ||
                           sent.trim().toLowerCase().includes(p.suspiciousText.trim().toLowerCase())
                    );

                    if (matched) {
                      const isSelected = selectedPassageId === matched.id;
                      const isExact = matched.matchType === 'Exact';

                      return (
                        <span
                          key={idx}
                          onClick={() => setSelectedPassageId(matched.id)}
                          className={`cursor-pointer px-1 py-0.5 rounded transition-all inline-block my-0.5 font-medium ${
                            isSelected
                              ? 'bg-rose-500 text-white ring-2 ring-rose-400 shadow-md'
                              : isExact
                              ? 'bg-rose-500/20 text-rose-300 border-b-2 border-rose-500 hover:bg-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500 hover:bg-amber-500/30'
                          }`}
                          title={`Similarity: ${matched.similarity}% (${matched.matchType}) with ${matched.sourceTitle}`}
                        >
                          {sent}{' '}
                        </span>
                      );
                    }

                    return <span key={idx}>{sent} </span>;
                  })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500"></span>
                <span>Verbatim / Exact Match (&gt;80%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500"></span>
                <span>Paraphrased Match (&gt;50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800"></span>
                <span>Original Content</span>
              </div>
            </div>
          </div>

          {/* Right: Matched Sources & Deep Dive Comparison */}
          <div className="lg:col-span-5 space-y-4">
            {/* Matched Sources Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Indexed Sources Matched ({report.matchedSources.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">Contribution</span>
              </div>

              {report.matchedSources.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <span>No significant overlap found in academic corpus.</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {report.matchedSources.map((src) => (
                    <div
                      key={src.sourceId}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 line-clamp-1">{src.title}</span>
                        <span className="font-bold text-rose-400 shrink-0 ml-2">{src.similarity}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{src.author}</span>
                        <span>{src.matchCount} matched passages</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, src.similarity)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Passage Comparison Inspector */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Passage Comparison Detail</span>
                </span>
                {activePassage && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {activePassage.similarity}% Match ({activePassage.matchType})
                  </span>
                )}
              </div>

              {activePassage ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 flex items-center gap-1">
                      <span>Manuscript Excerpt:</span>
                    </div>
                    <p className="text-slate-300 italic leading-relaxed">
                      "{activePassage.suspiciousText}"
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center justify-between">
                      <span>Source Excerpt ({activePassage.sourceTitle}):</span>
                    </div>
                    <p className="text-slate-300 italic leading-relaxed">
                      "{activePassage.matchedSourceText}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  <Info className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <span>Select any highlighted sentence in the manuscript to compare.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View 2: AI Writing Diagnostic */}
      {activeSubTab === 'ai' && (
        <AiAnalysisPanel report={report} />
      )}

      {/* View 3: Blockchain Ledger — mirrors DocumentRegistry.sol */}
      {activeSubTab === 'blockchain' && (
        <div className="space-y-4">
          {!hasBlock && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 text-center text-sm text-slate-400">
              <Blocks className="w-8 h-8 mx-auto mb-2 text-indigo-500/50" />
              <p className="font-semibold text-slate-300 mb-1">Legacy Report</p>
              <p>This report was saved before the blockchain ledger was introduced. Re-scan the document to generate a new chained block with SHA-256 hashes.</p>
            </div>
          )}
          {hasBlock && (
            <>
              {/* Contract Info Header */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                      <Blocks className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>DocumentRegistry Smart Contract</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Solidity ^0.8.24
                        </span>
                        {chainValid === true && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Chain Valid
                          </span>
                        )}
                        {chainValid === false && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            ⚠ Chain Tampered
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Each scan appends an immutable <code className="text-indigo-300">DocBlock</code> linked via SHA-256 <code className="text-indigo-300">prevHash</code> — mirroring <code className="text-indigo-300">registerDocument()</code> in <code className="text-indigo-300">contracts/DocumentRegistry.sol</code>.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-slate-400">Session ledger</div>
                    <div className="text-xl font-bold text-indigo-400">{ledger.length} block{ledger.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* This Report's Block */}
                <div className="mt-4 space-y-3">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Block #{thisBlock.blockIndex} — This Document
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {/* docHash */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-indigo-400" />docHash (SHA-256 of document)</span>
                        <button onClick={() => handleCopy(thisBlock.docHash, 'docHash')} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]">
                          {copiedKey === 'docHash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'docHash' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="text-slate-300 break-all text-[10px] bg-slate-900/60 p-2 rounded border border-slate-800">{thisBlock.docHash}</div>
                    </div>

                    {/* reportHash */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-amber-400" />reportHash (SHA-256 of payload)</span>
                        <button onClick={() => handleCopy(thisBlock.reportHash, 'reportHash')} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]">
                          {copiedKey === 'reportHash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'reportHash' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="text-slate-300 break-all text-[10px] bg-slate-900/60 p-2 rounded border border-slate-800">{thisBlock.reportHash}</div>
                    </div>

                    {/* prevHash */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span className="flex items-center gap-1"><Link2 className="w-3 h-3 text-slate-400" />prevHash (chain link)</span>
                        <button onClick={() => handleCopy(thisBlock.prevHash, 'prevHash')} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]">
                          {copiedKey === 'prevHash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'prevHash' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="text-slate-400 break-all text-[10px] bg-slate-900/60 p-2 rounded border border-slate-800">
                        {thisBlock.blockIndex === 0 ? <span className="text-slate-500 italic">Genesis block — no predecessor (0x000…0)</span> : thisBlock.prevHash}
                      </div>
                    </div>

                    {/* blockHash */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-emerald-400" />blockHash (this block's fingerprint)</span>
                        <button onClick={() => handleCopy(thisBlock.blockHash, 'blockHash')} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]">
                          {copiedKey === 'blockHash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'blockHash' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="text-emerald-300 break-all text-[10px] bg-slate-900/60 p-2 rounded border border-slate-800">{thisBlock.blockHash}</div>
                    </div>
                  </div>

                  {/* Block metadata row */}
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono mt-1">
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">blockIndex: <strong className="text-indigo-300">{thisBlock.blockIndex}</strong></span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">similarityPct: <strong className="text-amber-300">{thisBlock.similarityPct / 100}%</strong></span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">riskLevel: <strong className={isClean ? 'text-emerald-300' : isModerate ? 'text-amber-300' : 'text-rose-300'}>{thisBlock.riskLevel}</strong></span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">nonce: <strong className="text-slate-200">{thisBlock.nonce}</strong></span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 truncate max-w-[200px]">submitter: <strong className="text-indigo-300">{thisBlock.submitter}</strong></span>
                  </div>
                </div>
              </div>

              {/* Full Session Chain */}
              {ledger.length > 1 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Blocks className="w-4 h-4 text-indigo-400" />
                    Full Session Chain ({ledger.length} blocks)
                    <span className="text-[10px] text-slate-400 font-normal">— newest first</span>
                  </h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...ledger].reverse().map((blk) => {
                      const isCurrent = blk.blockIndex === thisBlock.blockIndex;
                      return (
                        <div
                          key={blk.blockIndex}
                          className={`p-3 rounded-xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center gap-2 ${
                            isCurrent
                              ? 'border-indigo-500/50 bg-indigo-950/20'
                              : 'border-slate-800 bg-slate-950'
                          }`}
                        >
                          <span className={`font-bold shrink-0 w-16 ${isCurrent ? 'text-indigo-300' : 'text-slate-400'}`}>
                            #{blk.blockIndex} {isCurrent ? '◀ this' : ''}
                          </span>
                          <span className="text-slate-300 truncate flex-1">{blk.title}</span>
                          <span className="text-slate-400 truncate text-[10px] max-w-[140px]">{blk.blockHash.slice(0, 20)}…</span>
                          <span className={`shrink-0 font-bold ${blk.riskLevel === 'Clean' ? 'text-emerald-400' : blk.riskLevel === 'Moderate' ? 'text-amber-400' : 'text-rose-400'}`}>
                            {blk.similarityPct / 100}%
                          </span>
                          <span className="text-slate-500 text-[10px] shrink-0">{new Date(blk.timestamp).toLocaleTimeString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <section className="border-t border-border pt-5 flex flex-wrap justify-between items-center gap-4">
        <h2 className="font-semibold text-foreground">Teacher submission report</h2>
        <Button disabled={!wordReport} onClick={() => { if (wordReport) void deliverFile(wordReport, `Comet-report-${report.id}.docx`); }}><Download />{wordReport ? 'Download Word report (.docx)' : 'Preparing Word report…'}</Button>
      </section>
    </div>
  );
};
