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

    if (!process.env.ANTHROPIC_API_KEY) {
      return { issues: [] as Issue[], sellerRedFlags: [] as string[], marketValueNote: "" };
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are an expert used car inspector specializing in JDM and performance vehicles. Analyze this car listing and return a JSON object with potential issues.

Vehicle: ${year} ${make} ${model}${engineType ? ` (${engineType})` : ""}
Mileage: ${mileage ? `${mileage.toLocaleString()} miles` : "unknown"}
Asking price: ${askingPrice ? `$${askingPrice.toLocaleString()}` : "unknown"}

Listing text:
${sanitizeInput(listingText)}

Return ONLY valid JSON, no markdown, no explanation:
{
  "issues": [
    {
      "id": "unique_snake_case_string",
      "label": "Short issue title (max 6 words)",
      "category": "Engine & Drivetrain" | "Chassis & Suspension" | "Body & Electrical",
      "severity": "HIGH" | "MED" | "LOW",
      "costMin": number (USD, total minimum),
      "costMax": number (USD, total maximum),
      "partsCostMin": number (USD),
      "partsCostMax": number (USD),
      "labourHours": number (decimal, e.g. 2.5),
      "explanation": "2-3 sentences explaining the issue, why it matters for this specific model, and what to check during inspection",
      "urgency": "Immediate" | "Soon" | "Monitor"
    }
  ],
  "sellerRedFlags": ["string", "string"],
  "marketValueNote": "One sentence about price vs market value"
}

Rules:
- Return 5-10 issues specific to ${year} ${make} ${model}
- Focus on known model-specific problems (e.g. timing chain, rust spots, common failures)
- costMin/costMax = parts + labour combined
- partsCostMin/partsCostMax = parts only
- labourHours = realistic shop hours
- HIGH severity = safety issue or $500+ repair
- MED severity = $150-500 or affects reliability  
- LOW severity = cosmetic or under $150`;

    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      const cleaned = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      const issues: Issue[] = (parsed.issues ?? []).map((item: Issue) => ({
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
      }));

      return {
        issues,
        sellerRedFlags: (parsed.sellerRedFlags ?? []) as string[],
        marketValueNote: String(parsed.marketValueNote ?? ""),
      };
    } catch (err) {
      console.error("Claude API error:", err);
      return { issues: [] as Issue[], sellerRedFlags: [] as string[], marketValueNote: "" };
    }
  });