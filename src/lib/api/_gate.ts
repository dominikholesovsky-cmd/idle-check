import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getRequestHeader } from "@tanstack/react-start/server";
import { PRICE_USD } from "@/lib/ghost/constants";
import { emailKey, verifyAccessToken } from "./_auth";
import { adminAllowlist, isAdminEmail, maskEmailForLog } from "./_admin";

// Server-only. Plain module, not a server function: it is imported by server function handlers only, so
// it never reaches the browser bundle. Every path that spends money (Anthropic), sends email or writes a
// report must call `assertPaidOrAdmin` before doing anything. The browser is never trusted.

const DENIED_MESSAGE = "Payment required"; // generic on purpose: never reveal which check failed

export type GateKind = "paid" | "admin";

export function deniedError(): Error {
  return new Error(DENIED_MESSAGE);
}

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/** Best effort caller IP for rate limits (Vercel sets x-forwarded-for). */
export function clientIp(): string {
  const forwarded = getRequestHeader("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || getRequestHeader("x-real-ip") || "unknown";
}

function log(reason: string, extra = "") {
  console.info(`[gate] ${reason}${extra ? ` ${extra}` : ""}`);
}

async function isPaidSession(sessionId: string, reportId: string): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) {
    log("paid:deny stripe_key_missing");
    return false; // fail closed
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const ok =
      session.status === "complete" &&
      session.payment_status === "paid" &&
      session.metadata?.reportId === reportId &&
      session.currency === "usd" &&
      (session.amount_total ?? 0) >= Math.round(PRICE_USD * 100);
    log(
      ok ? "paid:allow" : "paid:deny",
      `status=${session.status} payment_status=${session.payment_status} report_match=${session.metadata?.reportId === reportId} currency=${session.currency}`,
    );
    return ok;
  } catch {
    log("paid:deny stripe_lookup_failed"); // unknown or malformed session id, Stripe error: not paid
    return false;
  }
}

const ADMIN_CALLS_PER_HOUR = 60;

/**
 * A verified admin account (ADMIN_EMAILS) passes. It never depends on Stripe, on reportId metadata or on
 * Upstash: if the rate limiter is missing or fails, the call is allowed and the failure is logged.
 */
async function checkAdminToken(accessToken: string): Promise<boolean> {
  let email: string;
  try {
    email = (await verifyAccessToken(accessToken)).email; // fails closed without the service role key
    log("admin:token_verified", `user=${maskEmailForLog(email)}`);
  } catch (err) {
    log("admin:deny token_not_verified", `cause=${err instanceof Error ? err.message : "unknown"}`);
    return false;
  }

  // From here on the token is verified: any unexpected failure is logged with its cause.
  try {
    const entries = adminAllowlist().length;
    log("admin:allowlist", `configured=${entries > 0} entries=${entries}`);
    if (!isAdminEmail(email)) {
      log("admin:deny not_in_allowlist", `user=${maskEmailForLog(email)}`);
      return false;
    }
    log("admin:allowlist_match", `user=${maskEmailForLog(email)}`);

    const redis = getRedis();
    if (!redis) {
      log("admin:ratelimit_skipped redis_not_configured");
    } else {
      try {
        const limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(ADMIN_CALLS_PER_HOUR, "1 h"),
          prefix: "idle-check:admin-calls",
        });
        const { success } = await limiter.limit(emailKey(email));
        log("admin:ratelimit", `success=${success}`);
        if (!success) return false;
      } catch (err) {
        // A broken limiter must never lock a verified admin out.
        log("admin:ratelimit_error allowed", `cause=${err instanceof Error ? err.message : "unknown"}`);
      }
    }
    log("admin:allow");
    return true;
  } catch (err) {
    console.error("[gate] admin path failed after the token verified:", err);
    return false;
  }
}

/**
 * Passes for a paid Stripe Checkout session of this report, or for a verified admin account.
 * Anything else throws the same generic error. A request that carries an access token is judged as an
 * admin request only: a non-admin token never falls through to the paid path.
 */
export async function assertPaidOrAdmin(input: {
  sessionId?: string;
  reportId: string;
  accessToken?: string;
}): Promise<{ kind: GateKind }> {
  log(input.accessToken ? "path=admin" : "path=paid", `token_present=${!!input.accessToken}`);
  if (input.accessToken) {
    if (await checkAdminToken(input.accessToken)) return { kind: "admin" };
    throw deniedError();
  }
  if (input.sessionId && input.reportId && (await isPaidSession(input.sessionId, input.reportId))) {
    return { kind: "paid" };
  }
  if (!input.sessionId || !input.reportId) log("paid:deny missing_session_or_report");
  throw deniedError();
}
