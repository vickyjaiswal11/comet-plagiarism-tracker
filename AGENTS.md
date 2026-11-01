<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- VeriPlag app code lives in `src/vp/` (imported from an AI Studio export); `/` renders `VeriPlagApp`. Why: keeps the ported app self-contained.
- Plagiarism scoring runs in the browser (`src/vp/utils/plagiarism.ts`); AI analysis/rewrites go through server functions in `src/vp/ai.functions.ts` with a heuristic fallback. Why: no Python/Express server on the edge runtime.
- Reports are stored as jsonb in `public.reports` per user; profiles in `public.profiles` created by a signup trigger. Why: replaces Firestore with Lovable Cloud.
- User-owned reference texts persist in `public.original_sources` under owner-only RLS; scans snapshot reference IDs and names into their reports. Why: deletion affects future comparisons without rewriting historical results.
- Similarity aggregates best matched passage coverage across the entire original library, counting submitted passages once, alongside the strongest whole-document score. Why: every original contributes without duplicate-file inflation.
- Browser-only parsers are dynamically imported; legacy DOC uses initialized WASM and DOCX uses Mammoth. Why: supports binary Word formats without edge-incompatible processes.
- Word reports and certificate PDFs are prepared before the download click; certificate printing resets its ancestor layout and print colors. Why: avoids blank print output and preserves mobile download activation.
- Blockchain records are simulations and local fingerprints are non-cryptographic; UI and exports must not claim independent blockchain verification. Why: no real transaction or signature is issued by the scoring engine.
