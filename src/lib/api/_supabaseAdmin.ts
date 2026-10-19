import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only helper (never import it from client code). The privileged tables `leads` and
// `report_owners` have Row Level Security on and no policies, so only the service role can touch
// them. This helper FAILS CLOSED: without the service role key it throws and never falls back to the
// public anon key.
export function serviceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Service unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
