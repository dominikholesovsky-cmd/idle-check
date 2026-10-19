import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { assertPaidOrAdmin, clientIp, getRedis } from "./_gate";
import type { Issue, Category, Severity, Urgency } from "@/lib/ghost/types";

const InputSchema = z.object({
  data: z.object({
    listingText: z.string(),
    make: z.string(),
    model: z.string(),
    year: z.number().nullable(),
    engineType: z.string().optional().nullable(),
    mileage: z.number().nullable(),
    askingPrice: z.number().optional(),
    sessionId: z.string().optional(),
    reportId: z.string().optional(),
    adminSecret: z.string().optional(),
  }).optional(),
  listingText: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().nullable().optional(),
  engineType: z.string().optional().nullable(),
  mileage: z.number().nullable().optional(),
  askingPrice: z.number().optional(),
  sessionId: z.string().optional(),
  reportId: z.string().optional(),
  adminSecret: z.string().optional(),
});

function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/ignore previous instructions/gi, "")
    .slice(0, 4000)
    .trim();
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return cleaned;
  return cleaned.slice(start, end + 1);
}

// Optional USD market range from the model. Anything that is not a sane, ordered pair is dropped.
function parseMarketRange(parsed: any): { marketValueLow?: number; marketValueHigh?: number } {
  const low = Number(parsed?.marketValueLow);
  const high = Number(parsed?.marketValueHigh);
  if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high >= low) {
    return { marketValueLow: Math.round(low), marketValueHigh: Math.round(high) };
  }
  return {};
}

async function callClaudeWithRetry(fn: () => Promise<any>, maxAttempts = 3): Promise<any> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`Claude API attempt ${attempt}/${maxAttempts} failed:`, err);
      if (attempt < maxAttempts) {
        const delay = attempt * 1000; // 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export const analyzeVehicle = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    const input = data?.data ?? data;
    const listingText = input?.listingText ?? "";
    const make = input?.make ?? "";
    const model = input?.model ?? "";
    const year = input?.year ?? null;
    const engineType = input?.engineType ?? null;
    const mileage = input?.mileage ?? null;
    const askingPrice = input?.askingPrice ?? null;
    const sessionId = input?.sessionId;
    const reportId = input?.reportId ?? "";
    const adminSecret = input?.adminSecret;

    // 1. Authorization first. Nothing below runs (and no Anthropic request is made) for an unpaid caller.
    const { kind } = await assertPaidOrAdmin({ sessionId, reportId, adminSecret });

    // 2. Abuse limits. Redis outage never bypasses step 1; it only skips the counters.
    const redis = getRedis();
    if (redis) {
      try {
        if (kind === "paid" && sessionId) {
          // The first attempt plus one retry ("one retry at no extra charge"). A third is refused.
          const key = `analysis:attempts:${sessionId}`;
          const attempts = await redis.incr(key);
          if (attempts === 1) await redis.expire(key, 7 * 24 * 3600);
          if (attempts > 2) throw new Error("Too many attempts");
        }
        const ipLimit = new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(kind === "admin" ? 60 : 20, "1 h"),
          prefix: `idle-check:analyze-ip:${kind}`,
        });
        const { success } = await ipLimit.limit(clientIp());
        if (!success) throw new Error("Too many requests");
      } catch (err) {
        if (err instanceof Error && (err.message === "Too many attempts" || err.message === "Too many requests")) throw err;
        console.error("analyzeVehicle: rate limit backend unavailable, counters skipped");
      }
    } else {
      console.error("analyzeVehicle: Redis not configured, counters skipped");
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("analyzeVehicle: no API key");
      return {
        issues: [] as Issue[],
        sellerRedFlags: [] as string[],
        marketValueNote: "",
        marketValueLow: undefined as number | undefined,
        marketValueHigh: undefined as number | undefined,
      };
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 25000,
    });

    const vehicleStr = `${year ?? ""} ${make} ${model}${engineType ? ` (${engineType})` : ""}`.trim();
    const hasListing = listingText.trim().length > 20;

    const prompt = `Expert used car inspector. Return JSON only.

Vehicle: ${vehicleStr}
Mileage: ${mileage ? `${mileage.toLocaleString()} mi` : "unknown"}
Price: ${askingPrice ? `$${askingPrice.toLocaleString()}` : "unknown"}
${hasListing ? `\nListing (check for red flags and mentioned issues):\n"""${sanitizeInput(listingText)}"""` : ""}

Return this exact JSON:
{
  "issues": [{
    "id": "snake_case",
    "label": "max 6 words",
    "category": "Engine & Drivetrain"|"Chassis & Suspension"|"Body & Electrical",
    "severity": "HIGH"|"MED"|"LOW",
    "costMin": number,
    "costMax": number,
    "partsCostMin": number,
    "partsCostMax": number,
    "labourHours": number,
    "explanation": "2 sentences. Mention listing hints if relevant.",
    "urgency": "Immediate"|"Soon"|"Monitor",
    "parts": [{"name": "part name", "partNumber": "OEM# or null", "priceUsd": number, "source": "RockAuto"|"OEM Dealer"|"Estimated", "url": null}]
  }],
  "sellerRedFlags": ["red flags from listing or empty array"],
  "marketValueNote": "one sentence",
  "marketValueLow": number|null,
  "marketValueHigh": number|null
}

marketValueLow/marketValueHigh: typical fair USD market range for this car at this mileage, or null if unsure.

Rules: exactly 5 issues. Model-specific. costMin=partsCostMin+(labourHours*120). HIGH=$500+. MED=$150-500. LOW=under $150.${hasListing ? " Prioritize issues hinted in listing." : ""}`;

    try {
      console.log("analyzeVehicle: calling Claude for", vehicleStr);

      const message = await callClaudeWithRetry(() =>
        client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        })
      );

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      if (!responseText) throw new Error("Empty response");

      const parsed = JSON.parse(extractJson(responseText));

      const issues: Issue[] = (parsed.issues ?? []).map((item: any) => ({
        id: String(item.id),
        label: String(item.label),
        category: item.category as Category,
        severity: item.severity as Severity,
        costMin: Number(item.costMin) || 0,
        costMax: Number(item.costMax) || 0,
        partsCostMin: Number(item.partsCostMin) || 0,
        partsCostMax: Number(item.partsCostMax) || 0,
        labourHours: Number(item.labourHours) || 0,
        explanation: String(item.explanation),
        urgency: item.urgency as Urgency,
        parts: Array.isArray(item.parts)
          ? item.parts.map((p: any) => ({
              name: String(p.name ?? ""),
              partNumber: p.partNumber ? String(p.partNumber) : undefined,
              priceUsd: p.priceUsd ? Number(p.priceUsd) : undefined,
              source: p.source ?? "Estimated",
              url: p.url ? String(p.url) : undefined,
            }))
          : [],
      }));

      console.log("analyzeVehicle: success, issues:", issues.length);

      return {
        issues,
        sellerRedFlags: (parsed.sellerRedFlags ?? []) as string[],
        marketValueNote: String(parsed.marketValueNote ?? ""),
        marketValueLow: parseMarketRange(parsed).marketValueLow,
        marketValueHigh: parseMarketRange(parsed).marketValueHigh,
      };
    } catch (err) {
      console.error("Claude API error:", err);
      return {
        issues: [] as Issue[],
        sellerRedFlags: [] as string[],
        marketValueNote: "",
        marketValueLow: undefined as number | undefined,
        marketValueHigh: undefined as number | undefined,
      };
    }
  });