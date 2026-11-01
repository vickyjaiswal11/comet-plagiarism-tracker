import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Award, 
  Download, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';
import { PlagiarismReport } from '../utils/plagiarism';
import { reportStats } from '../utils/documents';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DashboardProps {
  reports: PlagiarismReport[];
  onSelectReport: (report: PlagiarismReport) => void;
  onOpenScan: () => void;
  onOpenCertificate: (report: PlagiarismReport) => void;
  onDeleteReport: (report: PlagiarismReport) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  reports,
  onSelectReport,
  onOpenScan,
  onOpenCertificate,
  onDeleteReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'All' | 'Clean' | 'Moderate' | 'High'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'similarity' | 'wordCount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter & Sort
  const filteredReports = reports.filter((report) => {
    const matchesRisk = filterRisk === 'All' || report.riskLevel === filterRisk;
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  filteredReports.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    } else if (sortBy === 'similarity') {
      comparison = b.similarityScore - a.similarityScore;
    } else if (sortBy === 'wordCount') {
      comparison = b.wordCount - a.wordCount;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  // Summary Metrics
  const stats = reportStats(reports);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `comet_reports_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // If there are 0 reports, render clean empty state
  if (reports.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Reports</h1>
            <p className="text-xs text-slate-400 mt-1">
              Check papers for plagiarism and view detailed similarity matches.
            </p>
          </div>
          <button
            onClick={onOpenScan}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Check a Paper</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">No Scanned Papers Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a document in PDF, Word, CSV, or Text format to run your first plagiarism check.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenScan}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Check First Paper</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review scanned documents, similarity scores, and originality certificates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Check Paper</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 uppercase">Total Papers</span>
          <div className="mt-1 text-2xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 uppercase">Average Match</span>
          <div className="mt-1 text-2xl font-bold text-indigo-400">{stats.avgSim}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 uppercase">Original</span>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{stats.cleanCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 uppercase">High Matches</span>
          <div className="mt-1 text-2xl font-bold text-rose-400">{stats.highMatches}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['All', 'Clean', 'Moderate', 'High'] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterRisk === risk
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {risk === 'Clean' ? 'Original' : risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase">
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-4">Author</th>
              <th className="py-3 px-4">Similarity Match</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredReports.map((report) => (
              <tr
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-200 hover:text-indigo-400 transition-colors">
                    {report.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(report.submittedAt).toLocaleDateString()} • {report.wordCount.toLocaleString()} words
                  </div>
                </td>

                <td className="py-3 px-4 text-slate-300">
                  {report.author}
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                      report.riskLevel === 'Clean'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : report.riskLevel === 'Moderate'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    <span>{report.similarityScore}%</span>
                    <span className="font-normal text-[10px]">
                      ({report.riskLevel === 'Clean' ? 'Original' : report.riskLevel})
                    </span>
                  </span>
                </td>

                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" title={`Delete document ${report.title}`} aria-label={`Delete document ${report.title}`} onClick={() => onDeleteReport(report)}><Trash2 className="text-destructive" /></Button>
                    <button
                      onClick={() => onSelectReport(report)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      View Report
                    </button>
                    <button
                      onClick={() => onOpenCertificate(report)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title="View Certificate"
                    >
                      <Award className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
