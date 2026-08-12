import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://wnersexjjephtuliihhg.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZXJzZXhqamVwaHR1bGlpaGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MDk0MjEsImV4cCI6MjEwMTk4NTQyMX0.SHvoIjlx9IVJ8UOi5qBumLGx9zfv5Zau8OjH3JE-Vpc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
