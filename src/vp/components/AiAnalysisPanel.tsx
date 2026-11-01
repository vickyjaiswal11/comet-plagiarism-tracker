import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Loader2, 
  BookOpen, 
  Quote, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { PlagiarismReport } from '../utils/plagiarism';
import { aiAnalyze, aiRewrite } from '../ai.functions';

interface AiAnalysisPanelProps {
  report: PlagiarismReport;
}

export const AiAnalysisPanel: React.FC<AiAnalysisPanelProps> = ({ report }) => {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  const [selectedPassageIndex, setSelectedPassageIndex] = useState<number>(0);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    try {
      const data = await aiAnalyze({ data: {
        document: report.content,
        title: report.title,
        author: report.author,
        similarityScore: report.similarityScore,
        wordCount: report.wordCount,
      } });
      if (data.success && data.analysis) {
        setAnalysisData(data.analysis);
      }
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiAnalysis();
  }, [report.id]);

  const handleRewritePassage = async () => {
    const passage = report.matchedPassages[selectedPassageIndex];
    if (!passage) return;

    setRewriting(true);
    setRewriteResult(null);

    try {
      const data = await aiRewrite({ data: {
        suspiciousText: passage.suspiciousText,
        sourceText: passage.matchedSourceText,
        sourceTitle: passage.sourceTitle,
        author: report.author,
      } });
      if (data.success) {
        setRewriteResult(data);
      }
    } catch (err) {
      console.error('Failed to rewrite passage:', err);
    } finally {
      setRewriting(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Originality & Writing Advisor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Checks if text appears AI-generated and suggests ways to rewrite flagged parts.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Re-analyze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-xs text-slate-300 font-medium">Analyzing text originality and writing style...</p>
        </div>
      ) : analysisData ? (
        <div className="space-y-6">
          {/* Main AI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Generated Likelihood */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>AI Content Chance</span>
                <BrainCircuit className="w-4 h-4 text-purple-400" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${
                  analysisData.aiGeneratedLikelihood > 60
                    ? 'text-rose-400'
                    : analysisData.aiGeneratedLikelihood > 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {analysisData.aiGeneratedLikelihood}%
                </span>
                <span className="text-xs text-slate-400">
                  {analysisData.aiGeneratedLikelihood > 60
                    ? 'Likely AI'
                    : analysisData.aiGeneratedLikelihood > 30
                    ? 'Partially Edited'
                    : 'Human Written'}
                </span>
              </div>

              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    analysisData.aiGeneratedLikelihood > 60
                      ? 'bg-rose-500'
                      : analysisData.aiGeneratedLikelihood > 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, analysisData.aiGeneratedLikelihood)}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Estimated probability based on sentence patterns and vocabulary.
              </p>
            </div>

            {/* Paraphrase Status */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Paraphrase Risk</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {analysisData.paraphraseRiskNotes}
              </p>
            </div>

            {/* Writing Style */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Writing Style</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {analysisData.stylisticAssessment}
              </p>
            </div>
          </div>

          {/* Executive Academic Critique */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Executive Integrity & Quality Assessment
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysisData.executiveSummary}
            </p>
          </div>

          {/* Actionable Ethical Remediations */}
          {analysisData.ethicalRemediations && analysisData.ethicalRemediations.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recommended Academic Remediations (Author Guidelines)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysisData.ethicalRemediations.map((item: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        {idx + 1}
                      </span>
                      <span>Action Step</span>
                    </div>
                    <p className="leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Passage Rewriter Tool */}
          {report.matchedPassages.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Quote className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white">
                    AI Ethical Passage Rewriter & Citation Generator
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Select a flagged sentence to generate zero-plagiarism alternatives
                </span>
              </div>

              {/* Passage selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  Select Flagged Sentence from Manuscript:
                </label>
                <select
                  value={selectedPassageIndex}
                  onChange={(e) => {
                    setSelectedPassageIndex(Number(e.target.value));
                    setRewriteResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                >
                  {report.matchedPassages.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      Passage #{idx + 1} ({p.similarity}% match with {p.sourceTitle}): "{p.suspiciousText.substring(0, 80)}..."
                    </option>
                  ))}
                </select>
              </div>

              {/* Active sentence preview */}
              {report.matchedPassages[selectedPassageIndex] && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Currently Flagged Text:</div>
                  <p className="italic text-slate-300">
                    "{report.matchedPassages[selectedPassageIndex].suspiciousText}"
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Source: <strong className="text-slate-300">{report.matchedPassages[selectedPassageIndex].sourceTitle}</strong>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleRewritePassage}
                  disabled={rewriting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {rewriting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing alternatives...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Ethical Academic Rewrites</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rewrite Output Card */}
              {rewriteResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
                  {/* Option 1: Direct Formal Quote */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-indigo-400 font-bold text-[11px]">
                      <span>Option A: Scholarly Direct Attribution</span>
                      <button
                        onClick={() => handleCopy(rewriteResult.quoteOption, 'quote')}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'quote' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'quote' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{rewriteResult.quoteOption}</p>
                    <p className="text-[10px] text-emerald-400">Recommended for definitions and established axiomatic theorems.</p>
                  </div>

                  {/* Option 2: Conceptual Synthesis */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-purple-400 font-bold text-[11px]">
                      <span>Option B: Original Critical Synthesis</span>
                      <button
                        onClick={() => handleCopy(rewriteResult.synthesisOption, 'synthesis')}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'synthesis' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'synthesis' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{rewriteResult.synthesisOption}</p>
                    <p className="text-[10px] text-purple-400">Completely replaces borrowed phrasing with author-driven critique.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
