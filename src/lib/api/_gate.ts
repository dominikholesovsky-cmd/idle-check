import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getRequestHeader } from "@tanstack/react-start/server";
import { PRICE_USD } from "@/lib/ghost/constants";
import { emailKey, isAdminEmail, verifyAccessToken } from "./_auth";

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

async function isPaidSession(sessionId: string, reportId: string): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) return false; // fail closed
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return (
      session.status === "complete" &&
      session.payment_status === "paid" &&
      session.metadata?.reportId === reportId &&
      session.currency === "usd" &&
      (session.amount_total ?? 0) >= Math.round(PRICE_USD * 100)
    );
  } catch {
    return false; // unknown or malformed session id, Stripe error: not paid
  }
}

const ADMIN_CALLS_PER_HOUR = 60;

/** A verified admin account (ADMIN_EMAILS) passes without Stripe, at most 60 gate calls per hour per admin. */
async function checkAdminToken(accessToken: string): Promise<boolean> {
  try {
    const user = await verifyAccessToken(accessToken); // fails closed without the service role key
    if (!isAdminEmail(user.email)) return false; // fails closed without ADMIN_EMAILS
    const redis = getRedis();
    if (redis) {
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(ADMIN_CALLS_PER_HOUR, "1 h"),
        prefix: "idle-check:admin-calls",
      });
      const { success } = await limiter.limit(emailKey(user.email));
      if (!success) return false;
    }
    return true;
  } catch {
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
  if (input.accessToken) {
    if (await checkAdminToken(input.accessToken)) return { kind: "admin" };
    throw deniedError();
  }
  if (input.sessionId && input.reportId && (await isPaidSession(input.sessionId, input.reportId))) {
    return { kind: "paid" };
  }
  throw deniedError();
}
