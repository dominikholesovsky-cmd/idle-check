import Stripe from "stripe";
import { createHash, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";
import { getRequestHeader } from "@tanstack/react-start/server";
import { PRICE_USD } from "@/lib/ghost/constants";

// Server-only. Plain module, not a server function: it is imported by server function handlers only, so
// it never reaches the browser bundle. Every path that spends money (Anthropic), sends email or writes a
// report must call `assertPaidOrAdmin` before doing anything. The browser is never trusted.

const DENIED_MESSAGE = "Payment required"; // generic on purpose: never reveal which check failed
const ADMIN_FAIL_LIMIT = 5; // failed admin attempts per IP per hour
const ADMIN_FAIL_WINDOW_S = 3600;

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

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** The interim admin path is only enabled when the secret is configured, long enough, and Redis is up. */
function adminPathEnabled(): boolean {
  const secret = process.env.ADMIN_BYPASS_SECRET;
  return !!secret && secret.length >= 24;
}

async function checkAdminSecret(candidate: string): Promise<boolean> {
  const secret = process.env.ADMIN_BYPASS_SECRET;
  if (!adminPathEnabled() || !secret) return false;
  const redis = getRedis();
  if (!redis) return false; // cannot rate-limit guesses, so the path stays closed
  const ip = clientIp();
  const failKey = `admin:fail:${ip}`;
  try {
    const failures = Number((await redis.get<number>(failKey)) ?? 0);
    if (failures >= ADMIN_FAIL_LIMIT) return false;
    // Hash both sides so the comparison is constant time whatever the lengths are.
    const ok = timingSafeEqual(sha256(candidate), sha256(secret));
    if (!ok) {
      const count = await redis.incr(failKey);
      if (count === 1) await redis.expire(failKey, ADMIN_FAIL_WINDOW_S);
    }
    return ok;
  } catch {
    return false;
  }
}

/**
 * Passes for a paid Stripe Checkout session of this report, or for the interim admin secret.
 * Anything else throws the same generic error.
 */
export async function assertPaidOrAdmin(input: {
  sessionId?: string;
  reportId: string;
  adminSecret?: string;
}): Promise<{ kind: GateKind }> {
  if (input.adminSecret) {
    if (await checkAdminSecret(input.adminSecret)) return { kind: "admin" };
    throw deniedError();
  }
  if (input.sessionId && input.reportId && (await isPaidSession(input.sessionId, input.reportId))) {
    return { kind: "paid" };
  }
  throw deniedError();
}
