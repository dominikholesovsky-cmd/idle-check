import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Issue } from "@/lib/ghost/types";

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

export const analyzeVehicle = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => {
    // Stub — when AI keys are configured, return real issues here.
    // Empty issues triggers the procedural fallback in routes/index.tsx.
    const issues: Issue[] = [];
    return {
      issues,
      sellerRedFlags: [] as string[],
      marketValueNote: "",
    };
  });
