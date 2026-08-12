const projectRef = "wnersexjjephtuliihhg";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  throw new Error("SUPABASE_ACCESS_TOKEN não configurado");
}
const sql = `
-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  papel TEXT NOT NULL DEFAULT 'analista',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create RLS Policies
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger function for user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, papel)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1)),
    'analista'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome = EXCLUDED.nome;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create tabelas_frete table for persisting freight tables
CREATE TABLE IF NOT EXISTS public.tabelas_frete (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  transportadora TEXT NOT NULL,
  abrangencia TEXT NOT NULL,
  versao INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'rascunho',
  vigencia_inicio DATE,
  vigencia_fim DATE,
  origem_arquivo TEXT,
  linhas JSONB NOT NULL DEFAULT '[]'::jsonb,
  auditoria JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_por TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  aprovado_por TEXT,
  aprovado_em TIMESTAMPTZ
);

ALTER TABLE public.tabelas_frete ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.tabelas_frete;
CREATE POLICY "Allow all for authenticated users" ON public.tabelas_frete
  FOR ALL USING (true) WITH CHECK (true);
`;

async function main() {
  console.log("Executando migration no Supabase via Management API...");
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: sql })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Erro na migration:", data);
      process.exit(1);
    }
    console.log("Migration executada com sucesso!", data);
  } catch (err) {
    console.error("Erro na requisição:", err);
    process.exit(1);
  }
}

main();
