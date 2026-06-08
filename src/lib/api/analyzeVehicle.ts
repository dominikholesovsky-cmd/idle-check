import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Recall } from "@/lib/ghost/types";

const InputSchema = z.object({
  vin: z.string().optional(),
  make: z.string(),
  model: z.string(),
  year: z.number().nullable(),
});

export const fetchRecalls = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => {
    const recalls: Recall[] = [];

    try {
      if (data.vin && data.vin.length === 17) {
        // VIN-based lookup — most accurate
        const res = await fetch(
          `https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${data.vin}`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (res.ok) {
          const json = await res.json();
          const results = json.results ?? [];

          results.slice(0, 5).forEach((r: any, i: number) => {
            recalls.push({
              id: `recall-${i}`,
              date: r.ReportReceivedDate
                ? new Date(r.ReportReceivedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "Unknown",
              component: r.Component ?? "Unknown Component",
              status: r.Remedy ? "Remedied" : "Open",
              description: r.Summary ?? undefined,
            });
          });

          if (recalls.length > 0) return { recalls, source: "vin" };
        }
      }

      // Fallback — make/model/year lookup
      if (data.make && data.model && data.year) {
        const make = encodeURIComponent(data.make.toUpperCase());
        const model = encodeURIComponent(data.model.toUpperCase());
        const year = data.year;

        const res = await fetch(
          `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (res.ok) {
          const json = await res.json();
          const results = json.results ?? [];

          results.slice(0, 5).forEach((r: any, i: number) => {
            recalls.push({
              id: `recall-nhtsa-${i}`,
              date: r.ReportReceivedDate
                ? new Date(r.ReportReceivedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "Unknown",
              component: r.Component ?? "Unknown Component",
              status: r.Remedy ? "Remedied" : "Open",
              description: r.Summary ?? undefined,
            });
          });
        }
      }
    } catch (err) {
      console.error("NHTSA fetch failed:", err);
      // Vrátí prázdné pole — fallback na procedural recalls se postará index.tsx
    }

    return { recalls, source: recalls.length > 0 ? "nhtsa" : "none" };
  });