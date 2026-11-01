import type { PlagiarismSource, PlagiarismReport } from './plagiarism';

export interface OriginalSource extends PlagiarismSource {
  file_name: string;
  file_type: string;
  created_at: string;
}

export function removeDocument<T extends { id: string }>(documents: T[], id: string): T[] {
  return documents.filter(document => document.id !== id);
}

export function reportStats(reports: PlagiarismReport[]) {
  return {
    total: reports.length,
    avgSim: reports.length ? (reports.reduce((sum, report) => sum + report.similarityScore, 0) / reports.length).toFixed(1) : '0.0',
    highMatches: reports.filter(report => report.riskLevel === 'High').length,
    cleanCount: reports.filter(report => report.riskLevel === 'Clean').length,
  };
}