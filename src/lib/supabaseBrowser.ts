import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The one Supabase client for browser code (anon key only). Several clients caused the
// "Multiple GoTrueClient instances" warning. Server code uses src/lib/api/_supabaseAdmin.ts instead.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        detectSessionInUrl: typeof window !== "undefined",
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, signal: options?.signal ?? AbortSignal.timeout(10000) }),
      },
    });
  }
  return client;
}
