import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
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
  }).optional(),
  listingText: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().nullable().optional(),
  engineType: z.string().optional().nullable(),
  mileage: z.number().nullable().optional(),
  askingPrice: z.number().optional(),
});

function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/ignore previous instructions/gi, "")
    .slice(0, 8000)
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
    console.log("analyzeVehicle called, API key present:", !!process.env.ANTHROPIC_API_KEY);
    const input = data?.data ?? data;
    const listingText = input?.listingText ?? "";
    const make = input?.make ?? "";
    const model = input?.model ?? "";
    const year = input?.year ?? null;
    const engineType = input?.engineType ?? null;
    const mileage = input?.mileage ?? null;
    const askingPrice = input?.askingPrice ?? null;

    if (!process.env.ANTHROPIC_API_KEY) {
      return { issues: [] as Issue[], sellerRedFlags: [] as string[], marketValueNote: "" };
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const vehicleStr = `${year ?? ""} ${make} ${model}${engineType ? ` (${engineType})` : ""}`.trim();

    const prompt = `You are an expert used car inspector specializing in JDM and performance vehicles. Analyze this listing and return accurate repair cost data with real current US market part prices.

Vehicle: ${vehicleStr}
Mileage: ${mileage ? `${mileage.toLocaleString()} miles` : "unknown"}
Asking price: ${askingPrice ? `$${askingPrice.toLocaleString()}` : "unknown"}

Listing text:
${sanitizeInput(listingText)}

Use web_search to find real current prices for the most common failure parts on this specific vehicle on RockAuto.com. Search for specific part numbers and prices.

Return ONLY valid JSON, no markdown, no explanation:
{
  "issues": [
    {
      "id": "unique_snake_case_string",
      "label": "Short issue title (max 6 words)",
      "category": "Engine & Drivetrain" | "Chassis & Suspension" | "Body & Electrical",
      "severity": "HIGH" | "MED" | "LOW",
      "costMin": number,
      "costMax": number,
      "partsCostMin": number,
      "partsCostMax": number,
      "labourHours": number,
      "explanation": "2-3 sentences. Mention specific part price found (e.g. 'Water pump ~$85 on RockAuto, part #AW4078').",
      "urgency": "Immediate" | "Soon" | "Monitor",
      "parts": [
        {
          "name": "Exact part name",
          "partNumber": "part number or null",
          "priceUsd": 49.99,
          "source": "RockAuto" | "eBay Motors" | "OEM Dealer" | "Estimated",
          "url": "direct URL to part or null"
        }
      ]
    }
  ],
  "sellerRedFlags": ["string"],
  "marketValueNote": "One sentence about price vs market value"
}

Rules:
- Return 6-10 issues specific to ${vehicleStr}
- Focus on known model-specific problems
- For EACH issue include 1-2 parts with real prices from web search
- partsCostMin/partsCostMax must reflect actual found prices
- costMin/costMax = partsCostMin/partsCostMax + (labourHours * 120)
- labourHours = realistic shop hours
- HIGH = safety issue or $500+ total
- MED = $150-500 or affects reliability
- LOW = cosmetic or under $150
- If part number not found after search, set partNumber to null
- If URL not found, set url to null
- Always prefer RockAuto prices over estimates`;

    try {
      // Krok 1 — Claude provede web search
      const firstResponse = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        tools: [
          {
            type: "web_search_20250305" as any,
            name: "web_search",
          },
        ],
        messages: [{ role: "user", content: prompt }],
      });

      // Krok 2 — vždy pokračuj, požádej o JSON
      const followUp = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        tools: [
          {
            type: "web_search_20250305" as any,
            name: "web_search",
          },
        ],
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: firstResponse.content },
          {
            role: "user",
            content: "Now return ONLY the JSON object. No explanation, no markdown, just the raw JSON starting with { and ending with }.",
          },
        ],
      });

      let responseText = "";
      for (const block of followUp.content) {
        if (block.type === "text") {
          responseText = block.text;
          break;
        }
      }

      // Krok 3 — pokud stále není JSON, zkus ještě jedno kolo
      if (!responseText || !responseText.includes('"issues"')) {
        const finalResponse = await client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: firstResponse.content },
            {
              role: "user",
              content: "Now return ONLY the JSON object. No explanation, no markdown, just the raw JSON starting with { and ending with }.",
            },
            { role: "assistant", content: followUp.content },
            {
              role: "user",
              content: "Return the JSON now. Start your response with { and nothing else.",
            },
          ],
        });
        for (const block of finalResponse.content) {
          if (block.type === "text") {
            responseText = block.text;
            break;
          }
        }
      }

      if (!responseText || !responseText.includes('"issues"')) {
        throw new Error("No valid JSON response after retries");
      }

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