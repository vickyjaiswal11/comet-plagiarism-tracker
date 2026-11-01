CREATE TABLE public.original_sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 title text NOT NULL,
 author text NOT NULL DEFAULT '',
 content text NOT NULL,
 file_name text NOT NULL DEFAULT '',
 file_type text NOT NULL DEFAULT 'TEXT',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.original_sources TO authenticated;
GRANT ALL ON public.original_sources TO service_role;
ALTER TABLE public.original_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own originals read" ON public.original_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own originals insert" ON public.original_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own originals update" ON public.original_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own originals delete" ON public.original_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX original_sources_user_id_idx ON public.original_sources(user_id);