import { expect, test, vi } from 'vitest';
import { File as NodeFile, Blob as NodeBlob } from 'node:buffer';
import { analyzePlagiarism } from './plagiarism';
import { removeDocument, reportStats } from './documents';
import { parseCsvText, parseJsonText, parseUploadedFile } from './fileParser';
import { createTeacherReport, createCertificatePdf } from './downloads';

const content = 'Solar panels convert sunlight into electrical energy using photovoltaic cells. Battery systems store surplus electricity for nighttime consumption.';
const original = { id: 'uploaded-original', title: 'Uploaded energy data', author: 'Teacher', content };
const meta = { title: 'Energy assignment', author: 'Student' };
vi.stubGlobal('File', NodeFile);
vi.stubGlobal('Blob', NodeBlob);

test('checks uploaded original data and records its identity', () => {
  const report = analyzePlagiarism(content, [original], meta);
  expect(report.similarityScore).toBe(100);
  expect(report.matchedSources[0]?.sourceId).toBe('uploaded-original');
  expect(report.referenceSources).toEqual([{ id: 'uploaded-original', title: 'Uploaded energy data', author: 'Teacher' }]);
});
test('does not fall back to sample data when originals are empty', () => {
  expect(() => analyzePlagiarism(content, [], meta)).toThrow('Add at least one original source');
});
test('combines matches across every original, including beyond the fourth file', () => {
  const sentences = [
    'Solar panels convert sunlight into electrical energy using photovoltaic cells.',
    'Penguins inhabit coastal Antarctica alongside seals and marine wildlife.',
    'Ancient ceramic vessels reveal trading patterns through archaeological excavations.',
    'Violin strings vibrate producing musical harmonics within wooden instruments.',
    'Volcanic eruptions release molten magma beneath continental tectonic plates.',
  ];
  const sources = sentences.map((text, index) => ({ id: `file-${index}`, title: `Original ${index}`, author: '', content: text }));
  const report = analyzePlagiarism(sentences.join(' '), sources, meta);
  expect(report.similarityScore).toBe(100);
  expect(report.referenceSources?.map(source => source.id)).toEqual(sources.map(source => source.id));
  expect(new Set(report.matchedPassages.map(passage => passage.sourceId)).size).toBe(5);
  expect(analyzePlagiarism(sentences.join(' '), sources.slice(0, 4), meta).similarityScore).toBeLessThan(100);
});
test('duplicate original files do not count the same matched text twice', () => {
  const submission = `${content} Penguins inhabit coastal Antarctica alongside seals and marine wildlife.`;
  const single = analyzePlagiarism(submission, [original], meta);
  const duplicates = analyzePlagiarism(submission, [original, { ...original, id: 'copy' }], meta);
  expect(duplicates.similarityScore).toBe(single.similarityScore);
  expect(new Set(duplicates.matchedPassages.map(passage => passage.id)).size).toBe(duplicates.matchedPassages.length);
});
test.each(['CSV', 'JSON'])('checks later source records inside a %s original file', format => {
  const first = 'Penguins inhabit coastal Antarctica alongside seals and marine wildlife';
  const later = 'Solar panels convert sunlight into electrical energy using photovoltaic cells';
  const parsed = format === 'CSV' ? parseCsvText(`content\n${first}\n${later}`) : parseJsonText(JSON.stringify({ papers: [{ content: first }, { content: later }] }));
  const report = analyzePlagiarism(later, [{ ...original, content: parsed }], meta);
  expect(report.similarityScore).toBe(100);
  expect(report.matchedPassages[0]?.matchedSourceText).toBe(later);
});
test('deleted originals are excluded from future comparisons', () => {
  const unrelated = { id: 'other', title: 'Other data', author: '', content: 'Penguins inhabit coastal Antarctica alongside seals and marine wildlife.' };
  const remaining = removeDocument([original, unrelated], original.id);
  expect(analyzePlagiarism(content, remaining, meta).similarityScore).toBe(0);
});
test('deletion recomputes paper count, average and risk counts', () => {
  const high = analyzePlagiarism(content, [original], meta);
  const clean = { ...high, id: 'clean', similarityScore: 0, riskLevel: 'Clean' as const };
  expect(reportStats(removeDocument([high, clean], high.id))).toEqual({ total: 1, avgSim: '0.0', highMatches: 0, cleanCount: 1 });
});
test('CSV preserves commas and quoted newlines in original text', () => {
  expect(parseCsvText('title,content\nEnergy,"Solar, wind\nand batteries"')).toBe('title content\nEnergy Solar, wind\nand batteries');
});
test('JSON extracts nested original text instead of syntax or keys', () => {
  expect(parseJsonText('{"papers":[{"content":"Original text","number":42}]}')).toBe('Original text');
});
test('text uploads retain their original content', async () => {
  const result = await parseUploadedFile(new File([content], 'original.txt'));
  expect(result.text).toBe(content);
});
test('certificate PDF produces a nonempty valid document', async () => {
  const { PDFDocument } = await import('pdf-lib');
  const report = analyzePlagiarism(content, [original], meta);
  const blob = await createCertificatePdf(report);
  const pdf = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
  expect(pdf.getPageCount()).toBeGreaterThan(0);
  expect(blob.size).toBeGreaterThan(1000);
});
test('teacher report produces a valid Word archive', async () => {
  const blob = await createTeacherReport(analyzePlagiarism(content, [original], meta));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  expect(Array.from(bytes.slice(0, 2))).toEqual([80, 75]);
  expect(blob.size).toBeGreaterThan(1000);
});