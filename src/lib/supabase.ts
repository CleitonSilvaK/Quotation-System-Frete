import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] || "";

export const supabaseConfigurado =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl) &&
  supabaseAnonKey.length > 20 &&
  supabaseAnonKey !== "******";

export const supabase = createClient(
  supabaseUrl || "https://invalid-project.supabase.co",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
