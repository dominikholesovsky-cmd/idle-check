import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serviceClient } from "./_supabaseAdmin";
import { maskEmail } from "@/lib/ghost/email";

const InputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  marketingOptIn: z.boolean(),
  consentText: z.string().max(500).optional(),
  source: z.string().max(40).optional(),
});

// Records the email from step 2 as a lead. Never blocks the analysis: the caller ignores failures.
// Opt-in rules: a new opt-in sets marketing_opt_in, consent_text and consented_at. An existing opt-in is
// never reset, and a lead that unsubscribed is never re-opted-in here.
export const captureLead = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    try {
      const db = serviceClient(); // throws (fails closed) when the service role key is missing
      const source = data.source ?? "landing";

      // Insert if new. Concurrent or repeated submits of the same email leave a single row.
      const { error: upsertError } = await db
        .from("leads")
        .upsert({ email: data.email, source }, { onConflict: "email", ignoreDuplicates: true });
      if (upsertError) throw upsertError;

      if (data.marketingOptIn) {
        const { data: lead, error } = await db
          .from("leads")
          .select("id, marketing_opt_in, unsubscribed_at")
          .eq("email", data.email)
          .single();
        if (error) throw error;
        if (!lead.marketing_opt_in && !lead.unsubscribed_at) {
          const { error: updateError } = await db
            .from("leads")
            .update({
              marketing_opt_in: true,
              consent_text: data.consentText ?? null,
              consented_at: new Date().toISOString(),
            })
            .eq("id", lead.id);
          if (updateError) throw updateError;
        }
      }
      return { ok: true as const };
    } catch (err) {
      // Log without the address or provider details, and give the client nothing to act on.
      console.error("captureLead failed for", maskEmail(data.email), err instanceof Error ? err.name : "error");
      throw new Error("Could not save");
    }
  });
