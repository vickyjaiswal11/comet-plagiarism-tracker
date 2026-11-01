import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  tokenize,
  generateNgrams,
  computeJaccardSimilarity,
  computeCosineSimilarity,
  computeKeccakSha256,
  extractSentences,
  analyzePlagiarism,
  sha256hex,
  verifyChain,
  getLedger,
} from './plagiarism';

test('tokenize normalizes words and removes stopwords when requested', () => {
  const text = 'The quick brown fox jumps over the lazy dog!';
  const allTokens = tokenize(text, false);
  assert.equal(allTokens.length, 9);
  assert.ok(allTokens.includes('quick'));
  assert.ok(allTokens.includes('fox'));

  const filtered = tokenize(text, true);
  assert.ok(!filtered.includes('the'));
  assert.ok(filtered.includes('brown'));
  assert.ok(filtered.includes('jumps'));
});

test('generateNgrams produces proper 3-gram shingles', () => {
  const tokens = ['blockchain', 'solidity', 'smart', 'contracts', 'verify', 'academic'];
  const trigrams = generateNgrams(tokens, 3);
  assert.equal(trigrams.length, 4);
  assert.equal(trigrams[0], 'blockchain solidity smart');
  assert.equal(trigrams[1], 'solidity smart contracts');
  assert.equal(trigrams[3], 'contracts verify academic');
});

test('computeJaccardSimilarity handles exact match, disjoint, and overlap', () => {
  const setA = new Set(['alpha', 'beta', 'gamma']);
  const setB = new Set(['alpha', 'beta', 'gamma']);
  assert.equal(computeJaccardSimilarity(setA, setB), 1.0);

  const setC = new Set(['delta', 'epsilon']);
  assert.equal(computeJaccardSimilarity(setA, setC), 0.0);

  const setD = new Set(['beta', 'gamma', 'zeta']);
  assert.equal(computeJaccardSimilarity(setA, setD), 0.5);
});

test('computeCosineSimilarity evaluates term vector angle', () => {
  const text1 = 'Artificial intelligence in healthcare diagnostics';
  const text2 = 'Artificial intelligence in healthcare diagnostics';
  const text3 = 'Completely unrelated marine biology ecosystems and oceanic depth';

  const simIdentical = computeCosineSimilarity(text1, text2);
  assert.ok(simIdentical > 0.99);

  const simDifferent = computeCosineSimilarity(text1, text3);
  assert.equal(simDifferent, 0.0);
});

test('sha256hex produces deterministic standard 66-character 0x hex hash', () => {
  const doc = 'Academic Integrity Blockchain Proof';
  const hash1 = sha256hex(doc);
  const hash2 = sha256hex(doc);

  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('0x'));
  assert.equal(hash1.length, 66);

  // Known test vector for empty string
  assert.equal(sha256hex(''), '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('extractSentences splits text appropriately', () => {
  const text = 'First sentence is clear. Second sentence follows immediately! Is this the third sentence? Yes.';
  const sentences = extractSentences(text);
  assert.ok(sentences.length >= 3);
  assert.equal(sentences[0], 'First sentence is clear.');
});

test('analyzePlagiarism stores document data in blocks with unique hash and links chain', () => {
  const sourceCorp = [
    {
      id: 'src-1',
      title: 'Decentralized Consensus in Modern Distributed Systems',
      author: 'Dr. Satoshi Nakamoto',
      content: 'Decentralized consensus algorithms ensure state machine replication across untrusted nodes without a central authority.'
    }
  ];

  const suspiciousDoc = 'Decentralized consensus algorithms ensure state machine replication across untrusted nodes without a central authority. Furthermore, we observe significant throughput advantages.';

  const report = analyzePlagiarism(suspiciousDoc, sourceCorp, {
    title: 'Distributed Ledgers Thesis',
    author: 'Alice Student',
    department: 'Computer Science'
  });

  assert.ok(report.similarityScore > 40);
  assert.equal(report.author, 'Alice Student');

  // Verify DocBlock fields mirror DocumentRegistry.sol struct
  assert.ok(report.block.docHash.startsWith('0x'));
  assert.equal(report.block.docHash.length, 66);
  assert.ok(report.block.reportHash.startsWith('0x'));
  assert.equal(report.block.reportHash.length, 66);
  assert.ok(report.block.blockHash.startsWith('0x'));
  assert.equal(report.block.blockHash.length, 66);
  assert.ok(report.block.prevHash.startsWith('0x'));
  assert.equal(report.block.prevHash.length, 66);
  assert.equal(typeof report.block.blockIndex, 'number');
  assert.ok(report.block.blockIndex >= 0);
  assert.ok(typeof report.block.similarityPct === 'number');
  assert.ok(report.block.submitter.startsWith('0x'));

  // Test chain validity
  assert.equal(verifyChain(getLedger()), true);

  assert.ok(report.matchedSources.length > 0);
  assert.equal(report.matchedSources[0]!.title, 'Decentralized Consensus in Modern Distributed Systems');
});
