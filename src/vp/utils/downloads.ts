import type { PlagiarismReport } from './plagiarism';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  downloadBlob(blob, filename);
}

export function reportSections(report: PlagiarismReport): { heading: string; lines: string[] }[] {
  return [
    { heading: 'Document details', lines: [
      `Title: ${report.title}`, `Author: ${report.author}`, `Department: ${report.department}`,
      `Report ID: ${report.id}`, `Checked: ${new Date(report.submittedAt).toISOString()}`, `Words: ${report.wordCount}`,
    ] },
    { heading: 'Similarity results', lines: [
      `Similarity: ${report.similarityScore}%`, `Originality: ${report.originalityScore}%`, `Risk: ${report.riskLevel}`,
      `Sources checked: ${report.referenceSources?.length ?? 'Not recorded (legacy report)'}`,
      report.referenceSources ? 'Scope: only the uploaded original sources listed below; not the internet or published-paper databases.' : 'Scope: legacy scan; original source library was not recorded.',
      'Scores estimate text overlap, not proof of authorship or academic misconduct.',
    ] },
    { heading: 'Original sources checked', lines: report.referenceSources?.map(source => `${source.title} — ${source.author || 'Author not specified'}`) ?? ['Source list not recorded for this legacy report.'] },
    { heading: 'Matching sources', lines: report.matchedSources.length ? report.matchedSources.map(source => `${source.title} — ${source.similarity}% similarity; ${source.matchCount} matched passages`) : ['No significant matches found within the checked sources.'] },
    { heading: 'Matched passages', lines: report.matchedPassages.length ? report.matchedPassages.flatMap((passage, index) => [
      `${index + 1}. ${passage.sourceTitle} (${passage.similarity}%, ${passage.matchType})`,
      `Submitted: ${passage.suspiciousText}`, `Original: ${passage.matchedSourceText}`,
    ]) : ['No matched passages.'] },
    { heading: 'Blockchain ledger block', lines: [
      `Block index: ${report.block.blockIndex}`,
      `docHash (SHA-256 of document): ${report.block.docHash}`,
      `reportHash (SHA-256 of payload): ${report.block.reportHash}`,
      `prevHash (chain link): ${report.block.prevHash}`,
      `blockHash (this block fingerprint): ${report.block.blockHash}`,
      `Similarity stored (x100): ${report.block.similarityPct}`,
      `Risk level: ${report.block.riskLevel}`,
      `Submitter address: ${report.block.submitter}`,
      `Timestamp: ${report.block.timestamp}`,
      'Hashes computed with SHA-256 (Web Crypto API), mirroring DocumentRegistry.sol keccak256 calls.',
    ] },
    { heading: 'Submitted document', lines: report.content.split(/\n+/).filter(Boolean) },
  ];
}

export async function createTeacherReport(report: PlagiarismReport): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
  const doc = new Document({
    creator: 'Comet', title: `Comet report — ${report.title}`,
    sections: [{ children: [
      new Paragraph({ text: 'COMET — SIMILARITY REPORT', heading: HeadingLevel.TITLE }),
      ...reportSections(report).flatMap(section => [
        new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }),
        ...section.lines.map(line => new Paragraph({ children: [new TextRun(line)], spacing: { after: 140 } })),
      ]),
    ] }],
  });
  return Packer.toBlob(doc);
}

export async function createCertificatePdf(report: PlagiarismReport): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 785;
  const write = (text: string, heading = false) => {
    // Standard PDF fonts support Latin text; replace unsupported glyphs safely.
    const clean = text.replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
    const selectedFont = heading ? bold : font;
    const size = heading ? 15 : 10;
    const words = clean.match(/\S{1,65}/g) ?? [];
    let line = '';
    const flush = () => {
      if (y < 55) { page = pdf.addPage([595, 842]); y = 785; }
      page.drawText(line, { x: 45, y, size, font: selectedFont, color: rgb(0.12, 0.12, 0.12) });
      y -= heading ? 24 : 16;
    };
    for (const word of words) {
      if (line && selectedFont.widthOfTextAtSize(`${line} ${word}`, size) > 500) { flush(); line = ''; }
      line = line ? `${line} ${word}` : word;
    }
    if (line) flush();
    y -= 8;
  };
  write('COMET', true);
  write('Certificate of Originality — Blockchain Ledger Record', true);
  for (const section of reportSections(report).filter(section => ['Document details', 'Similarity results', 'Original sources checked', 'Blockchain ledger block'].includes(section.heading))) {
    write(section.heading, true);
    section.lines.forEach(line => write(line));
  }
  return new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' });
}