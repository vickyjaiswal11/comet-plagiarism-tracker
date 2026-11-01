import { useEffect, useState } from 'react';
import { X, Printer, Download, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlagiarismReport } from '../utils/plagiarism';
import { createCertificatePdf, deliverFile, downloadBlob, reportSections } from '../utils/downloads';

interface CertificateModalProps { report: PlagiarismReport; onClose: () => void; }
export function CertificateModal({ report, onClose }: CertificateModalProps) {
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    createCertificatePdf(report).then(blob => { if (!cancelled) setPdf(blob); }).catch(() => { if (!cancelled) setError('PDF preparation failed. You can still print the certificate.'); });
    return () => { cancelled = true; };
  }, [report]);
  const sections = reportSections(report).filter(section => ['Document details', 'Similarity results', 'Original sources checked', 'Blockchain ledger block'].includes(section.heading));
  return <div className="certificate-overlay fixed inset-0 z-50 overflow-y-auto bg-background/90 p-4 backdrop-blur-sm">
    <div className="certificate-shell mx-auto my-4 w-full max-w-3xl rounded-lg border border-border bg-card text-card-foreground shadow-xl">
      <div className="certificate-actions flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2 font-semibold text-sm"><Award />Originality certificate</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadBlob(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }), `Comet-proof-${report.id}.json`)}><Download />JSON proof</Button>
          <Button size="sm" disabled={!pdf} onClick={() => { if (pdf) void deliverFile(pdf, `Comet-certificate-${report.id}.pdf`); }}><Download />{pdf ? 'Download PDF' : 'Preparing PDF…'}</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer />Print / Save PDF</Button>
          <Button variant="ghost" size="icon" aria-label="Close certificate modal" onClick={onClose}><X /></Button>
        </div>
      </div>
      {error && <p role="alert" className="certificate-actions p-4 text-destructive">{error}</p>}
      <div id="printable-certificate" className="p-6 sm:p-10 space-y-6">
        <header className="text-center space-y-3 border-b border-border pb-6"><Award className="mx-auto size-10 text-primary" /><p className="text-lg font-bold">COMET</p><h2 className="font-serif text-2xl font-bold">Certificate of Originality</h2><p className="text-sm text-muted-foreground">Similarity audit record · Document hash anchored in blockchain ledger (SHA-256)</p></header>
        {sections.map(section => <section key={section.heading} className="space-y-2"><h3 className="font-semibold">{section.heading}</h3>{section.lines.map((line, index) => <p key={index} className="text-sm leading-relaxed break-words">{line}</p>)}</section>)}
      </div>
    </div>
  </div>;
}
