import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

export const loadReportBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sessionId: z.string() }))
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY!,
    );

    const { data: row } = await supabase
      .from("reports")
      .select("id")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return row ? { shareId: row.id as string } : null;
  });
