import { createHash } from "node:crypto";
import { serviceClient } from "./_supabaseAdmin";

// Server-only. Verifies a Supabase access token and checks the admin allowlist. Everything here fails closed:
// no service role key, a bad token, an unconfirmed email or a missing ADMIN_EMAILS all mean "not authorized".

export interface VerifiedUser {
  email: string; // lowercased
}

/** Returns the verified user for a token, or throws a generic error. Never logs the token or the email. */
export async function verifyAccessToken(accessToken: string): Promise<VerifiedUser> {
  if (!accessToken || accessToken.length > 4096) throw new Error("Unauthorized");
  const db = serviceClient(); // throws without the service role key
  const { data, error } = await db.auth.getUser(accessToken);
  const user = data?.user;
  if (error || !user?.email || !user.email_confirmed_at) throw new Error("Unauthorized");
  return { email: user.email.trim().toLowerCase() };
}

function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** False when ADMIN_EMAILS is missing or empty. */
export function isAdminEmail(email: string): boolean {
  return adminEmails().has(email.trim().toLowerCase());
}

/** Stable, non personal key for per-user counters (the raw email never goes into Redis keys). */
export function emailKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}
