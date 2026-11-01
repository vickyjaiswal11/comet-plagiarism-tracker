import Papa from 'papaparse';

export interface FileParseResult {
  text: string;
  fileName: string;
  fileType: string;
  wordCount: number;
  characterCount: number;
}

/**
 * Parses CSV text into clean, structured paragraphs.
 */
export function parseCsvText(rawCsv: string): string {
  const parsed = Papa.parse<string[]>(rawCsv, { skipEmptyLines: true });
  return parsed.data.map(row => row.map(cell => cell.trim()).filter(Boolean).join(' ')).join('\n');
}

export function parseJsonText(raw: string): string {
  const collect = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(collect);
    if (value && typeof value === 'object') return Object.values(value).flatMap(collect);
    return [];
  };
  return collect(JSON.parse(raw)).join('\n');
}

/**
 * Universal file parser supporting PDF, DOCX, CSV, TXT, MD, JSON.
 */
export async function parseUploadedFile(file: File): Promise<FileParseResult> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  let extractedText = '';

  if (extension === 'txt' || extension === 'md' || extension === 'text') {
    extractedText = await file.text();
  } else if (extension === 'json') {
    extractedText = parseJsonText(await file.text());
  } else if (extension === 'csv') {
    const raw = await file.text();
    extractedText = parseCsvText(raw);
  } else if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    extractedText = result.value || '';
  } else if (extension === 'doc') {
    const { default: init, WasmDocument } = await import('office-oxide-wasm/web');
    await init();
    const doc = new WasmDocument(new Uint8Array(await file.arrayBuffer()), 'doc');
    try { extractedText = doc.plainText(); } finally { doc.free(); }
  } else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      pages.push(tc.items.map((it: any) => ('str' in it ? it.str : '')).join(' '));
    }
    extractedText = pages.join('\n');
  } else {
    throw new Error('Unsupported format. Choose TXT, MD, PDF, DOC, DOCX, CSV or JSON.');
  }

  const cleanText = extractedText.replace(/\r\n/g, '\n').trim();
  if (!cleanText) throw new Error('No readable text found. For scanned PDFs, use a text-searchable PDF or paste the text.');
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;

  return {
    text: cleanText,
    fileName,
    fileType: extension.toUpperCase(),
    wordCount: words,
    characterCount: cleanText.length,
  };
}
