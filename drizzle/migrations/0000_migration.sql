CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Scholar',
  email text NOT NULL DEFAULT '',
  institution text NOT NULL DEFAULT 'University Research Lab',
  department text NOT NULL DEFAULT 'Computer Science',
  role text NOT NULL DEFAULT 'Academic Auditor',
  wallet_address text NOT NULL DEFAULT '',
  similarity_threshold int NOT NULL DEFAULT 20,
  ai_analysis_enabled boolean NOT NULL DEFAULT true,
  detect_ai_generated_content boolean NOT NULL DEFAULT true,
  auto_attest_blockchain boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, institution, department, wallet_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'institution','University Research Lab'),
    COALESCE(NEW.raw_user_meta_data->>'department','Computer Science'),
    '0x' || substr(md5(random()::text) || md5(random()::text), 1, 40)
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.reports (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL
);
CREATE INDEX reports_user_idx ON public.reports(user_id, submitted_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports select" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reports insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reports delete" ON public.reports FOR DELETE TO authenticated USING (auth.uid() = user_id);