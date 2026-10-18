# Phase 5: save emails and reports per email (backend)

Prerequisites: phases 1 and 4 are done, and I have run `sql/001-leads-and-owners.sql` in Supabase (tables `leads` and `report_owners`, RLS on, no policies). Do not run DDL yourself. Read the data and privacy rules in the brief first.

Goal: capture a lead when the user submits step 2, link every saved report to that email, prefill the Stripe checkout email. No marketing sends, no login, no bundles in this phase.

## Steps
1. New server function `src/lib/api/captureLead.ts`: input (zod) `{ email: string (valid, max 254), marketingOptIn: boolean, consentText?: string, source?: string }`. Trim and lowercase the email. Use the service role client; if `SUPABASE_SERVICE_ROLE_KEY` is missing, throw and do nothing (never fall back to the anon key). Upsert into `leads` on `email`. Opt-in rules: a new opt-in sets `marketing_opt_in = true`, `consent_text`, `consented_at`; an existing opt-in is never silently reset; a lead with `unsubscribed_at` set is never re-opted-in by this function. Return nothing sensitive (`{ ok: true }`).
2. Call `captureLead` from `handleAnalyze` in `index.tsx` right after submit, fire and forget. It must never block or fail the analysis; swallow errors and log only a masked email. Send `consentText` equal to the exact checkbox label when opted in.
3. `saveReport`: add an optional `email` input field next to `sessionId` and `reportJson`. After inserting the report, if an email is present, look up the lead by email (create it if missing, without changing opt-in) and insert a `report_owners` row `{ report_id, lead_id }`. The email stays out of `report_json`; the public JSON only has `savedToEmail: true` (set in phase 1). Update `attemptSaveAndEmail` and `handleRetrySave` in `index.tsx` to pass the email separately from the stored state.
4. `createCheckoutSession`: add an optional `customerEmail` input and pass it as `customer_email` to Stripe Checkout. `index.tsx` passes the stored email. `sendReportEmail` stays unchanged (it already reads the address from the Stripe session).
5. Hygiene: no full emails in logs; zod validation on every new input; keep error messages generic for the client.

## Acceptance
- With a test run: one row in `leads`, one in `report_owners` pointing at the saved report, `marketing_opt_in` matching the checkbox, Stripe Checkout prefilled with the same email, the received report email goes to it.
- `select report_json from reports` for that report contains no email field.
- Using the anon key, selects on `leads` and `report_owners` return nothing or a permission error (state how you verified).
- Submitting the same email twice creates one lead.
- Existing flows still work: admin bypass, demo mode, old localStorage entries without an email (skip `captureLead` and the owner link when there is no email).
- Report back: files changed, and any place where the email could still leak that I should know about.

## Not in this phase (ask me before starting)
- Hardening the `reports` table: it currently has a public SELECT policy with `true` and a public INSERT policy, so anyone with the anon key can list or insert reports. The clean fix is to load `/report/:id` through a server function with the service role and then drop both public policies. This is separate work with a risk of breaking the shared page, so it only happens when I ask.
- Marketing emails, unsubscribe link, privacy policy text, magic-link login, report bundles.
