import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
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
  }).optional(),
  listingText: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().nullable().optional(),
  engineType: z.string().optional().nullable(),
  mileage: z.number().nullable().optional(),
  askingPrice: z.number().optional(),
  sessionId: z.string().optional(),
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

export const analyzeVehicle = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
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

    // Rate limit: 1 call per Stripe session — prevent credit drain on repeated calls
    if (
      sessionId &&
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(1, "24 h"),
        prefix: "idle-check:analyze",
      });
      const { success } = await ratelimit.limit(sessionId);
      if (!success) {
        console.warn("analyzeVehicle: rate limit exceeded for session", sessionId);
        throw new Error("Rate limit exceeded: this report has already been generated.");
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("analyzeVehicle: no API key");
      return { issues: [] as Issue[], sellerRedFlags: [] as string[], marketValueNote: "" };
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 55000,
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
  "marketValueNote": "one sentence"
}

Rules: exactly 5 issues. Model-specific. costMin=partsCostMin+(labourHours*120). HIGH=$500+. MED=$150-500. LOW=under $150.${hasListing ? " Prioritize issues hinted in listing." : ""}`;

    try {
      console.log("analyzeVehicle: calling Claude for", vehicleStr);

      const message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });

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
      };
    } catch (err) {
      console.error("Claude API error:", err);
      return {
        issues: [] as Issue[],
        sellerRedFlags: [] as string[],
        marketValueNote: "",
      };
    }
  });