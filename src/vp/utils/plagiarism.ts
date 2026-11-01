/**
 * Core text similarity engine and browser-side blockchain ledger for VeriPlag.
 *
 * BLOCKCHAIN MODEL
 * ─────────────────
 * Mirrors the DocumentRegistry Solidity contract at contracts/DocumentRegistry.sol.
 * Each scan appends an immutable DocBlock whose prevHash = SHA-256 of the
 * previous block's canonical fields, forming an immutable linked-list ledger.
 *
 * Hash function: Pure synchronous standard SHA-256 (FIPS 180-4), returning
 * 0x + 64 hex characters (32 bytes), directly matching Solidity bytes32.
 *
 * The ledger persists in sessionStorage across scans so the full chain of blocks
 * can be inspected and validated in the UI.
 *
 * Solidity contract ABI reference (contracts/DocumentRegistry.sol):
 *   registerDocument(bytes32 docHash, bytes32 reportHash, string title,
 *                    string author, uint16 similarityPct, RiskLevel riskLevel)
 *   verifyChain() → bool
 *   getBlock(uint256 index) → DocBlock
 */

/* ───────────────────────────── Public Interfaces ──────────────────────── */

export interface PlagiarismSource {
  id: string;
  title: string;
  author: string;
  year?: string;
  category?: string;
  content: string;
}

export interface MatchedPassage {
  id: string;
  sentenceIndex: number;
  suspiciousText: string;
  matchedSourceText: string;
  similarity: number;
  matchType: 'Exact' | 'Paraphrased';
  sourceTitle: string;
  sourceId: string;
}

export interface MatchedSourceResult {
  sourceId: string;
  title: string;
  author: string;
  similarity: number;
  matchCount: number;
}

/** Mirrors the DocBlock struct in DocumentRegistry.sol */
export interface DocBlock {
  blockIndex: number;       // uint256 blockIndex
  docHash: string;          // bytes32 — SHA-256 of raw document text
  reportHash: string;       // bytes32 — SHA-256 of report payload string
  prevHash: string;         // bytes32 — SHA-256 of previous block's fields (0x00…0 for genesis)
  blockHash: string;        // bytes32 — SHA-256 of this block's own fields (mirrors _blockHash())
  title: string;            // string
  author: string;           // string
  similarityPct: number;    // uint16 — similarity × 100 (e.g. 4250 = 42.50%)
  riskLevel: 'Clean' | 'Moderate' | 'High'; // RiskLevel enum
  submitter: string;        // address — wallet address that registered the block
  timestamp: string;        // uint256 block.timestamp as ISO string
  nonce: number;            // extra entropy for block uniqueness
}

export interface PlagiarismReport {
  id: string;
  title: string;
  author: string;
  department: string;
  submittedAt: string;
  wordCount: number;
  characterCount: number;
  similarityScore: number;
  originalityScore: number;
  riskLevel: 'Clean' | 'Moderate' | 'High';
  status: 'Verified' | 'Flagged' | 'Under Review';
  content: string;
  matchedSources: MatchedSourceResult[];
  matchedPassages: MatchedPassage[];
  referenceSources?: { id: string; title: string; author: string }[];
  /** The immutable blockchain block registered for this scan */
  block: DocBlock;
}

/* ─────────────────────────── Browser Blockchain Ledger ────────────────── */

const LEDGER_KEY = 'vp_blockchain_ledger';
export const GENESIS_PREV = '0x' + '0'.repeat(64);

/** Load the persistent ledger from sessionStorage or memory fallback. */
function loadLedger(): DocBlock[] {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as DocBlock[]) : [];
  } catch {
    return [];
  }
}

/** Save the ledger back to sessionStorage. */
function saveLedger(ledger: DocBlock[]): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    /* quota exceeded / private mode — silently ignore */
  }
}

/** Read the current ledger (exported for the UI). */
export function getLedger(): DocBlock[] {
  return loadLedger();
}

/** Verify every block's prevHash matches the previous block's blockHash. */
export function verifyChain(ledger: DocBlock[]): boolean {
  if (ledger.length === 0) return true;
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].prevHash !== ledger[i - 1].blockHash) return false;
  }
  return true;
}

/* ───────────────────── Pure Synchronous SHA-256 (FIPS 180-4) ──────────── */

/**
 * Standard SHA-256 hash algorithm in pure TypeScript.
 * Produces deterministic 0x-prefixed 64 hex characters (32 bytes / bytes32).
 */
export function sha256hex(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  bytes.push(
    (highBits >>> 24) & 0xff,
    (highBits >>> 16) & 0xff,
    (highBits >>> 8) & 0xff,
    highBits & 0xff,
    (lowBits >>> 24) & 0xff,
    (lowBits >>> 16) & 0xff,
    (lowBits >>> 8) & 0xff,
    lowBits & 0xff
  );

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H0 = 0x6a09e667;
  let H1 = 0xbb67ae85;
  let H2 = 0x3c6ef372;
  let H3 = 0xa54ff53a;
  let H4 = 0x510e527f;
  let H5 = 0x9b05688c;
  let H6 = 0x1f83d9ab;
  let H7 = 0x5be0cd19;

  const W = new Int32Array(64);
  const rightRotate = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = chunk + i * 4;
      W[i] = (bytes[idx] << 24) | (bytes[idx + 1] << 16) | (bytes[idx + 2] << 8) | bytes[idx + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(W[i - 15], 7) ^ rightRotate(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rightRotate(W[i - 2], 17) ^ rightRotate(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
    H5 = (H5 + f) | 0;
    H6 = (H6 + g) | 0;
    H7 = (H7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `0x${toHex(H0)}${toHex(H1)}${toHex(H2)}${toHex(H3)}${toHex(H4)}${toHex(H5)}${toHex(H6)}${toHex(H7)}`;
}

/** Canonical string for block hashing — mirrors abi.encodePacked() in _blockHash() */
function blockCanonical(b: Omit<DocBlock, 'blockHash'>): string {
  return [
    b.blockIndex,
    b.docHash,
    b.reportHash,
    b.prevHash,
    b.timestamp,
    b.submitter,
    b.similarityPct,
    b.riskLevel,
    b.nonce,
  ].join('|');
}

/** Simulated Ethereum-style wallet address (deterministic). */
function simulatedAddress(seed: string): string {
  const hash = sha256hex(seed || 'anonymous');
  return '0x' + hash.slice(2, 42);
}

/* ─────────────────────────── NLP / Similarity ─────────────────────────── */

export const STOPWORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are',
  'as','at','be','because','been','before','being','below','between','both','but',
  'by','can','cannot','could','did','do','does','doing','down','during','each',
  'few','for','from','further','had','has','have','having','he','her','here',
  'hers','herself','him','himself','his','how','i','if','in','into','is','it',
  'its','itself','just','me','more','most','my','myself','no','nor','not','of',
  'off','on','once','only','or','other','our','ours','ourselves','out','over',
  'own','same','she','should','so','some','such','than','that','the','their',
  'theirs','them','themselves','then','there','these','they','this','those','through',
  'to','too','under','until','up','very','was','we','were','what','when','where',
  'which','while','who','whom','why','with','would','you','your','yours','yourself',
]);

export function tokenize(text: string, removeStopwords = false): string[] {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);
  return removeStopwords ? words.filter((w) => !STOPWORDS.has(w) && w.length > 1) : words;
}

export function generateNgrams(tokens: string[], n = 3): string[] {
  if (!tokens || tokens.length === 0) return [];
  if (tokens.length < n) return [tokens.join(' ')];
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) ngrams.push(tokens.slice(i, i + n).join(' '));
  return ngrams;
}

export function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function computeCosineSimilarity(textA: string, textB: string): number {
  const tA = tokenize(textA, true);
  const tB = tokenize(textB, true);
  if (tA.length === 0 || tB.length === 0) return 0;
  const fA: Record<string, number> = {};
  const fB: Record<string, number> = {};
  for (const t of tA) fA[t] = (fA[t] || 0) + 1;
  for (const t of tB) fB[t] = (fB[t] || 0) + 1;
  const keys = new Set([...Object.keys(fA), ...Object.keys(fB)]);
  let dot = 0, mA = 0, mB = 0;
  for (const k of keys) {
    dot += (fA[k] || 0) * (fB[k] || 0);
  }
  for (const k in fA) mA += (fA[k] ?? 0) ** 2;
  for (const k in fB) mB += (fB[k] ?? 0) ** 2;
  if (mA === 0 || mB === 0) return 0;
  return dot / (Math.sqrt(mA) * Math.sqrt(mB));
}

export function extractSentences(text: string): string[] {
  if (!text) return [];
  return text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 5);
}

export function findMatchedPassages(
  docText: string,
  sourceText: string,
  sourceId: string,
  sourceTitle: string,
  minWords = 4,
): MatchedPassage[] {
  const docSentences = extractSentences(docText);
  const srcSentences = extractSentences(sourceText);
  const matches: MatchedPassage[] = [];

  docSentences.forEach((docSent, idx) => {
    const docTokens = tokenize(docSent, true);
    if (docTokens.length < minWords) return;
    const docSet = new Set(docTokens);
    let bestSim = 0, bestSrc = '';

    for (const srcSent of srcSentences) {
      const srcTokens = tokenize(srcSent, true);
      if (srcTokens.length < 3) continue;
      const sim = computeJaccardSimilarity(docSet, new Set(srcTokens));
      if (sim > bestSim) { bestSim = sim; bestSrc = srcSent; }
    }

    if (bestSim >= 0.52 && bestSrc) {
      matches.push({
        id: `match-${sourceId}-${idx}`,
        sentenceIndex: idx,
        suspiciousText: docSent,
        matchedSourceText: bestSrc,
        similarity: Math.round(bestSim * 100),
        matchType: bestSim >= 0.82 ? 'Exact' : 'Paraphrased',
        sourceTitle,
        sourceId,
      });
    }
  });

  return matches;
}

/* ─────────────────────── Main Similarity Orchestrator ─────────────────── */

/**
 * Runs a full plagiarism scan and records an immutable block in the blockchain ledger.
 * Document text and report data are hashed with standard SHA-256 (unique 32-byte hash)
 * and chained via prevHash to the previous block.
 */
export function analyzePlagiarism(
  docText: string,
  sources: PlagiarismSource[],
  meta: { title: string; author: string; department?: string; userId?: string },
): PlagiarismReport {
  if (!sources.length) throw new Error('Add at least one original source before checking a paper.');

  const tokens     = tokenize(docText);
  const wordCount  = tokens.length;
  const charCount  = docText.length;
  const docHash    = sha256hex(docText || 'empty');
  const submitter  = simulatedAddress(meta.userId || meta.author || 'anon');
  const timestamp  = new Date().toISOString();

  /* ── Empty-document shortcut ── */
  if (wordCount === 0) {
    const reportHash = sha256hex('empty-report');
    return _buildReport({
      meta, docText, wordCount, charCount, docHash, reportHash,
      overallSimilarity: 0, originalityScore: 100, riskLevel: 'Clean',
      matchedSources: [], allMatches: [], sources, submitter, timestamp,
    });
  }

  /* ── Run similarity engine ── */
  const docShingles = new Set(generateNgrams(tokenize(docText, true), 3));
  const matchedSources: MatchedSourceResult[] = [];
  const allMatches: MatchedPassage[] = [];

  for (const src of sources) {
    const srcShingles = new Set(generateNgrams(tokenize(src.content, true), 3));
    const jaccard = computeJaccardSimilarity(docShingles, srcShingles);
    const cosine  = computeCosineSimilarity(docText, src.content);
    const combined = jaccard * 0.6 + cosine * 0.4;
    const pct      = Math.min(100, Math.round(combined * 100 * 10) / 10);
    const passages = findMatchedPassages(docText, src.content, src.id, src.title);
    allMatches.push(...passages);
    if (pct > 2 || passages.length > 0) {
      matchedSources.push({ sourceId: src.id, title: src.title, author: src.author, similarity: pct, matchCount: passages.length });
    }
  }

  matchedSources.sort((a, b) => b.similarity - a.similarity);

  const bestPassages = new Map<number, MatchedPassage>();
  for (const p of allMatches) {
    const prev = bestPassages.get(p.sentenceIndex);
    if (!prev || p.similarity > prev.similarity) bestPassages.set(p.sentenceIndex, p);
  }
  const matchedWords = Array.from(bestPassages.values()).reduce(
    (sum, p) => sum + tokenize(p.suspiciousText).length * p.similarity / 100, 0,
  );
  const coverage  = (matchedWords / wordCount) * 100;
  const highest   = matchedSources[0]?.similarity ?? 0;
  const overallSimilarity = Math.min(100, Math.round(Math.max(highest, coverage) * 10) / 10);
  const originalityScore  = Math.max(0, Math.round((100 - overallSimilarity) * 10) / 10);
  const riskLevel: 'Clean' | 'Moderate' | 'High' =
    overallSimilarity >= 35 ? 'High' : overallSimilarity >= 15 ? 'Moderate' : 'Clean';

  const reportPayload = `${docHash}|${overallSimilarity}|${wordCount}|${meta.author}|${meta.title}|${timestamp}`;
  const reportHash    = sha256hex(reportPayload);

  return _buildReport({
    meta, docText, wordCount, charCount, docHash, reportHash,
    overallSimilarity, originalityScore, riskLevel,
    matchedSources, allMatches, sources, submitter, timestamp,
  });
}

/* ─────────────────────── Internal block builder ───────────────────────── */

interface BuildParams {
  meta: { title: string; author: string; department?: string };
  docText: string;
  wordCount: number;
  charCount: number;
  docHash: string;
  reportHash: string;
  overallSimilarity: number;
  originalityScore: number;
  riskLevel: 'Clean' | 'Moderate' | 'High';
  matchedSources: MatchedSourceResult[];
  allMatches: MatchedPassage[];
  sources: PlagiarismSource[];
  submitter: string;
  timestamp: string;
}

function _buildReport(p: BuildParams): PlagiarismReport {
  const ledger = loadLedger();
  const blockIndex = ledger.length;
  const prevHash   = ledger.length === 0 ? GENESIS_PREV : ledger[ledger.length - 1].blockHash;
  const nonce      = Math.floor(Math.random() * 0xffffffff);

  const partialBlock: Omit<DocBlock, 'blockHash'> = {
    blockIndex,
    docHash:       p.docHash,
    reportHash:    p.reportHash,
    prevHash,
    title:         p.meta.title || 'Untitled Document',
    author:        p.meta.author || 'Anonymous',
    similarityPct: Math.round(p.overallSimilarity * 100),
    riskLevel:     p.riskLevel,
    submitter:     p.submitter,
    timestamp:     p.timestamp,
    nonce,
  };

  const blockHash = sha256hex(blockCanonical(partialBlock));
  const newBlock: DocBlock = { ...partialBlock, blockHash };

  ledger.push(newBlock);
  saveLedger(ledger);

  const reportId = `REP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;

  return {
    id:               reportId,
    title:            p.meta.title || 'Academic Manuscript',
    author:           p.meta.author || 'Anonymous Author',
    department:       p.meta.department || 'Computer Science',
    submittedAt:      p.timestamp,
    wordCount:        p.wordCount,
    characterCount:   p.charCount,
    similarityScore:  p.overallSimilarity,
    originalityScore: p.originalityScore,
    riskLevel:        p.riskLevel,
    status:           p.riskLevel === 'High' ? 'Flagged' : p.riskLevel === 'Moderate' ? 'Under Review' : 'Verified',
    content:          p.docText,
    matchedSources:   p.matchedSources,
    matchedPassages:  p.allMatches,
    referenceSources: p.sources.map(({ id, title, author }) => ({ id, title, author })),
    block:            newBlock,
  };
}

/* ─────────────────────────────── Compatibility ────────────────────────── */

/** Computes deterministic 64-hex SHA-256 hash */
export function computeKeccakSha256(text: string): string {
  return sha256hex(text);
}
