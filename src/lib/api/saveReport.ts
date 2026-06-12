import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const InputSchema = z.object({
  sessionId: z.string().optional(),
  reportJson: z.record(z.unknown()),
});

export const saveReport = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => {
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

    return { id: shareId };
  });
