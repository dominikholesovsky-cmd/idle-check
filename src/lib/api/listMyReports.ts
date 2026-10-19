import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serviceClient } from "./_supabaseAdmin";
import { verifyAccessToken } from "./_auth";

interface ReportJsonShape {
  vehicle?: { year?: unknown; make?: unknown; model?: unknown; mileage?: unknown };
  askingPrice?: unknown;
  recommendation?: { verdict?: unknown };
}

export interface MyReportRow {
  id: string;
  createdAt: string;
  vehicleLabel: string;
  mileage: number | null;
  askingPrice: number | null;
  verdict: "buy" | "negotiate" | "walkaway" | null;
}

// The signed-in user's saved reports: leads (by verified email) -> report_owners -> reports.
// Returns a fixed, small shape. Never emails, listing text or the full report_json.
export const listMyReports = createServerFn({ method: "POST" })
  .validator(z.object({ accessToken: z.string().min(1).max(4096) }))
  .handler(async ({ data }): Promise<MyReportRow[]> => {
    const user = await verifyAccessToken(data.accessToken);
    const db = serviceClient();

    const { data: lead, error: leadError } = await db
      .from("leads")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (leadError) throw new Error("Could not load reports");
    if (!lead) return [];

    const { data: owned, error: ownedError } = await db
      .from("report_owners")
      .select("report_id")
      .eq("lead_id", lead.id)
      .limit(500);
    if (ownedError) throw new Error("Could not load reports");
    const ids = (owned ?? []).map((o) => o.report_id as string);
    if (ids.length === 0) return [];

    const { data: rows, error: reportsError } = await db
      .from("reports")
      .select("id, created_at, report_json")
      .in("id", ids)
      .order("created_at", { ascending: false })
      .limit(50);
    if (reportsError) throw new Error("Could not load reports");

    return (rows ?? []).map((row) => {
      const json = (row.report_json ?? {}) as ReportJsonShape;
      const v = json.vehicle ?? {};
      const verdict = json.recommendation?.verdict;
      return {
        id: String(row.id),
        createdAt: String(row.created_at),
        vehicleLabel: `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.replace(/\s+/g, " ").trim() || "Vehicle",
        mileage: typeof v.mileage === "number" ? v.mileage : null,
        askingPrice: typeof json.askingPrice === "number" ? json.askingPrice : null,
        verdict: verdict === "buy" || verdict === "negotiate" || verdict === "walkaway" ? verdict : null,
      };
    });
  });
