import { useRef, useState } from 'react';
import { BookOpen, Upload, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseUploadedFile } from '../utils/fileParser';
import type { OriginalSource } from '../utils/documents';

interface Props {
  sources: OriginalSource[];
  onAdd: (source: Omit<OriginalSource, 'id' | 'created_at'>) => Promise<void>;
  onDelete: (source: OriginalSource) => Promise<void>;
}

export function OriginalLibrary({ sources, onAdd, onDelete }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError('');
    try {
      for (const file of Array.from(files)) {
        const parsed = await parseUploadedFile(file);
        await onAdd({ title: file.name.replace(/\.[^.]+$/, ''), author: author.trim(), content: parsed.text, file_name: file.name, file_type: parsed.fileType });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save original source.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  const addText = async () => {
    setBusy(true); setError('');
    try {
      await onAdd({ title: title.trim() || 'Untitled original', author: author.trim(), content: text.trim(), file_name: '', file_type: 'TEXT' });
      setText(''); setTitle('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save original.'); }
    finally { setBusy(false); }
  };
  const filtered = sources.filter(source => `${source.title} ${source.author}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen />Original Sources <span className="text-muted-foreground">({sources.length})</span></h1>
      <Button onClick={() => input.current?.click()} disabled={busy}><Upload />Upload originals</Button>
      <input ref={input} type="file" multiple aria-label="Upload original files" accept=".txt,.text,.md,.pdf,.doc,.docx,.csv,.json" className="hidden" onChange={event => upload(event.target.files)} />
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {busy && <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Saving originals…</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><label htmlFor="original-title" className="text-sm">Original title</label><input id="original-title" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-input bg-background p-3 text-sm" /></div>
      <div className="space-y-2"><label htmlFor="original-author" className="text-sm">Original author (optional)</label><input id="original-author" value={author} onChange={e => setAuthor(e.target.value)} className="w-full rounded-md border border-input bg-background p-3 text-sm" /></div>
    </div>
    <div className="space-y-2"><label htmlFor="original-text" className="text-sm">Original text</label><textarea id="original-text" rows={6} value={text} onChange={e => setText(e.target.value)} className="w-full rounded-md border border-input bg-background p-3 text-sm" /></div>
    <Button onClick={addText} disabled={busy || !text.trim()}><Plus />Save original text</Button>
    <div className="border-t border-border pt-5 space-y-4">
      <div className="flex items-center gap-2"><Search className="size-4 text-muted-foreground" /><input aria-label="Search originals" placeholder="Search originals…" value={query} onChange={e => setQuery(e.target.value)} className="w-full max-w-sm rounded-md border border-input bg-background p-2 text-sm" /></div>
      {!sources.length && <p className="text-muted-foreground">No original sources yet.</p>}
      {sources.length > 0 && !filtered.length && <p className="text-muted-foreground">No matching originals.</p>}
      {filtered.map(source => <article key={source.id} className="border-b border-border py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1"><h2 className="font-semibold break-words">{source.title}</h2><p className="text-xs text-muted-foreground">{source.author || 'Author not specified'} · {source.file_type} · {source.content.split(/\s+/).length} words</p><p className="text-sm text-muted-foreground line-clamp-2 break-words">{source.content}</p></div>
        <Button variant="ghost" size="icon" disabled={busy} title={`Delete original ${source.title}`} aria-label={`Delete original ${source.title}`} onClick={async () => { setError(''); try { await onDelete(source); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Deletion failed.'); } }}><Trash2 className="text-destructive" /></Button>
      </article>)}
    </div>
  </div>;
}