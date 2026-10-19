import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { serviceClient } from "./_supabaseAdmin";
import { maskEmail } from "@/lib/ghost/email";
import { assertPaidOrAdmin } from "./_gate";

const InputSchema = z.object({
  sessionId: z.string().optional(),
  // Only for the interim admin path (phase 6); never stored or logged.
  adminSecret: z.string().optional(),
  reportJson: z.record(z.unknown()),
  // Kept out of report_json on purpose (that table is publicly readable). Only used to link the owner.
  email: z.string().trim().toLowerCase().email().max(254).optional(),
});

export const saveReport = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    // Writing a report requires a paid session for this report (or a verified admin).
    const reportId = typeof data.reportJson.reportId === "string" ? data.reportJson.reportId : "";
    await assertPaidOrAdmin({ sessionId: data.sessionId, reportId, adminSecret: data.adminSecret });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY!,
    );

    const { data: row, error } = await supabase
      .from("reports")
      .insert({ session_id: data.sessionId ?? null, report_json: data.reportJson })
      .select("id")
      .single();

    if (error) throw new Error(`Failed to save report: ${error.message}`);

    const shareId = row.id as string;

    // Embed shareId into report_json so it survives future loads via /report/:id
    await supabase
      .from("reports")
      .update({ report_json: { ...data.reportJson, shareId } })
      .eq("id", shareId);

    // Link the report to its owner. Tolerant: a failure here must never lose the saved report.
    if (data.email) {
      try {
        const db = serviceClient(); // fails closed without the service role key
        const { error: leadError } = await db
          .from("leads")
          .upsert({ email: data.email, source: "report" }, { onConflict: "email", ignoreDuplicates: true });
        if (leadError) throw leadError;
        const { data: lead, error: findError } = await db
          .from("leads")
          .select("id")
          .eq("email", data.email)
          .single();
        if (findError) throw findError;
        const { error: ownerError } = await db
          .from("report_owners")
          .upsert({ report_id: shareId, lead_id: lead.id }, { onConflict: "report_id", ignoreDuplicates: true });
        if (ownerError) throw ownerError;
      } catch (err) {
        console.error("Owner link failed for", maskEmail(data.email), err instanceof Error ? err.name : "error");
      }
    }

    return { id: shareId };
  });
