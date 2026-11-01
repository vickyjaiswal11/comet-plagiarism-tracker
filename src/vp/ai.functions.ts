import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

async function askJson(prompt: string): Promise<any | null> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) return null;
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.warn('AI gateway error', res.status, await res.text());
      return null;
    }
    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? '';
    return JSON.parse(raw.replace(/^```json/i, '').replace(/```$/i, '').trim());
  } catch (e) {
    console.warn('AI call failed', e);
    return null;
  }
}

export const aiAnalyze = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      document: z.string().min(1).max(200000),
      title: z.string().max(500).optional(),
      author: z.string().max(200).optional(),
      similarityScore: z.number().optional(),
      wordCount: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sim = data.similarityScore ?? 0;
    const parsed = await askJson(`You are a world-class academic integrity auditor.
Analyze this manuscript and its preliminary similarity findings.
Title: ${data.title ?? 'Academic Manuscript'}
Author: ${data.author ?? 'Scholar'}
Lexical Similarity Score: ${sim}%
Word Count: ${data.wordCount ?? 0}

Manuscript:
"""
${data.document.substring(0, 4500)}
"""

Return ONLY a JSON object with keys:
executiveSummary (2-3 sentences), aiGeneratedLikelihood (integer 0-100), stylisticAssessment (string),
paraphraseRiskNotes (string), ethicalRemediations (array of 3 strings).`);

    if (parsed) return { success: true, aiEngine: 'Lovable AI', analysis: parsed };

    // Heuristic fallback
    const words = data.document.split(/\s+/).filter(Boolean);
    const unique = new Set(words.map((w) => w.toLowerCase()));
    const diversity = words.length ? (unique.size / words.length) * 100 : 50;
    const ai = Math.min(95, Math.max(8, Math.round((100 - diversity) * 1.2 + (sim > 40 ? 25 : 0))));
    return {
      success: true,
      aiEngine: 'Heuristic analyzer',
      analysis: {
        executiveSummary: `The manuscript shows ${
          sim < 15 ? 'strong original thought with minimal borrowing' : sim < 40 ? 'moderate overlap in core definitions' : 'high verbatim overlap requiring revision'
        }. Vocabulary diversity is ${Math.round(diversity)}%.`,
        aiGeneratedLikelihood: ai,
        stylisticAssessment: ai > 60 ? 'Uniform clause structures typical of automated generation.' : 'Varied sentence length and natural phrasing.',
        paraphraseRiskNotes: sim > 20 ? 'Some passages suggest synonym substitution over source templates.' : 'Low probability of deliberate obfuscation.',
        ethicalRemediations: [
          'Put verbatim definitions in quotation marks with a citation.',
          'Synthesize concepts through comparative critique rather than paraphrase.',
          'Cite every source that shaped a flagged passage.',
        ],
      },
    };
  });

export const aiRewrite = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      suspiciousText: z.string().min(1).max(5000),
      sourceText: z.string().max(5000).optional(),
      sourceTitle: z.string().max(500).optional(),
      author: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const parsed = await askJson(`You are an expert academic writing advisor.
Flagged passage: "${data.suspiciousText}"
Original source (${data.sourceTitle ?? 'Cited literature'}): "${data.sourceText ?? ''}"
Return ONLY a JSON object with keys: quoteOption (properly quoted & cited version),
synthesisOption (fully rewritten original synthesis), academicAdvice (one sentence).`);
    if (parsed) return { success: true, ...parsed };
    const title = data.sourceTitle || 'the referenced literature';
    return {
      success: true,
      quoteOption: `As noted in "${title}", "${data.suspiciousText}"`,
      synthesisOption: `Building on ${title}, this work argues that ${data.suspiciousText.toLowerCase()}`,
      academicAdvice: 'Attribute the original idea and add your own commentary.',
    };
  });
